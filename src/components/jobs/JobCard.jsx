import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Building2, Star } from "lucide-react";

const jobTypeLabels = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  remote: "Remote",
};

const categoryLabels = {
  technology: "Technology", healthcare: "Healthcare", finance: "Finance",
  education: "Education", engineering: "Engineering", sales: "Sales",
  marketing: "Marketing", hospitality: "Hospitality", retail: "Retail",
  construction: "Construction", transport: "Transport", admin: "Admin",
  legal: "Legal", manufacturing: "Manufacturing", other: "Other",
};

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {job.is_featured && (
                  <span className="flex items-center gap-1 text-accent text-xs font-semibold">
                    <Star className="w-3 h-3 fill-accent" />
                    FEATURED
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                {job.title}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{job.company_name}</span>
              </div>
            </div>
            {(job.salary_min || job.salary_max) && (
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-accent">
                  €{job.salary_min?.toLocaleString()}{job.salary_max ? ` - €${job.salary_max.toLocaleString()}` : "+"}
                </p>
                {job.salary_period && (
                  <p className="text-xs text-muted-foreground">per {job.salary_period}</p>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {job.short_description || job.description?.slice(0, 150)}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="text-xs font-medium">
              <MapPin className="w-3 h-3 mr-1" />
              {job.location}
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              <Clock className="w-3 h-3 mr-1" />
              {jobTypeLabels[job.job_type] || job.job_type}
            </Badge>
            {job.category && (
              <Badge variant="outline" className="text-xs">
                {categoryLabels[job.category] || job.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}