import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase } from "lucide-react";
import JobCard from "../components/jobs/JobCard";
import JobFilters from "../components/jobs/JobFilters";

export default function Jobs() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "",
    category: searchParams.get("category") || "",
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => digify.entities.Job.filter({ status: "approved" }, "-created_date", 100),
  });

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const kw = filters.keyword.toLowerCase();
      const loc = filters.location.toLowerCase();
      if (kw && !job.title?.toLowerCase().includes(kw) && !job.description?.toLowerCase().includes(kw) && !job.company_name?.toLowerCase().includes(kw)) return false;
      if (loc && !job.location?.toLowerCase().includes(loc)) return false;
      if (filters.type && job.job_type !== filters.type) return false;
      if (filters.category && job.category !== filters.category) return false;
      return true;
    });
  }, [jobs, filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Browse Jobs</h1>
          <p className="text-primary-foreground/70">
            Find your perfect role from {jobs.length} active opportunities
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <JobFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({ keyword: "", location: "", type: "", category: "" })}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl border p-6">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}