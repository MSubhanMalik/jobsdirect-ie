import React, { useEffect, useMemo, useState } from "react";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { getAdultDateMax, isAtLeast18 } from "@/lib/age";
import FormFieldRenderer from "@/components/forms/FormFieldRenderer";
import {
  COMPANY_FIELD_GROUPS,
  COMPANY_FIELDS,
  EMPLOYER_FORM_DEFAULTS,
  buildEntityFormValues,
  hasFieldValue,
} from "@/lib/siteSettings";
import { Save } from "lucide-react";

const EMPLOYER_VISIBLE_FIELDS = COMPANY_FIELDS.filter((field) => !field.adminOnly && field.manageInEmployerForm !== false);

function createEmployerForm(employer) {
  return buildEntityFormValues(EMPLOYER_FORM_DEFAULTS, EMPLOYER_VISIBLE_FIELDS, employer);
}

export default function EmployerProfile({ employer, setEmployer }) {
  const { toast } = useToast();
  const { appPublicSettings } = useAuth();
  const [form, setForm] = useState(() => createEmployerForm(employer));
  const [saving, setSaving] = useState(false);
  const maxDateOfBirth = getAdultDateMax();
  const companyFormConfig = appPublicSettings?.public_settings?.employer_company_form_config || {};

  useEffect(() => {
    setForm(createEmployerForm(employer));
  }, [employer]);

  const visibleGroups = useMemo(
    () =>
      COMPANY_FIELD_GROUPS.map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
          if (field.adminOnly || field.manageInEmployerForm === false) return false;
          return companyFormConfig?.[field.key]?.visible !== false;
        }),
      })).filter((group) => group.fields.length),
    [companyFormConfig],
  );

  const updateField = (fieldKey, value) => {
    setForm((current) => ({ ...current, [fieldKey]: value }));
  };

  const handleSave = async () => {
    if (form.date_of_birth && !isAtLeast18(form.date_of_birth)) {
      toast({
        title: "Invalid Date of Birth",
        description: "Employer profile users must be at least 18 years old.",
        variant: "destructive",
      });
      return;
    }

    for (const group of visibleGroups) {
      for (const field of group.fields) {
        const control = companyFormConfig?.[field.key];
        if (control?.required && !hasFieldValue(field, form[field.key])) {
          toast({
            title: "Missing required field",
            description: `${field.label} is required before saving this profile.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const updated = await digify.entities.Employer.update(employer.id, form);
      setEmployer({ ...employer, ...updated });
      toast({ title: "Profile Updated", description: "Your employer profile has been saved." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!visibleGroups.length ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            All employer company fields are currently hidden. Enable them from Super Admin Site CMS.
          </div>
        ) : null}

        {visibleGroups.map((group) => (
          <section key={group.id} className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <FormFieldRenderer
                  key={field.key}
                  field={{
                    ...field,
                    inputProps: field.key === "date_of_birth" ? { max: maxDateOfBirth } : undefined,
                  }}
                  value={form[field.key]}
                  onChange={(value) => updateField(field.key, value)}
                  required={Boolean(companyFormConfig?.[field.key]?.required)}
                />
              ))}
            </div>
          </section>
        ))}

        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
