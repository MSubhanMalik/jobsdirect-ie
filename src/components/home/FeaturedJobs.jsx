import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ArrowRight, Star, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const jobTypeLabels = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  remote: "Remote",
};

export default function FeaturedJobs() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: () => digify.entities.Job.filter({ status: "approved", is_featured: true }, "-created_date", 6),
  });

  // If no featured jobs, show latest approved
  const { data: latestJobs = [] } = useQuery({
    queryKey: ["latest-jobs"],
    queryFn: () => digify.entities.Job.filter({ status: "approved" }, "-created_date", 6),
    enabled: !isLoading && jobs.length === 0,
  });

  const displayJobs = jobs.length > 0 ? jobs : latestJobs;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Featured Opportunities
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the latest positions from top employers across Ireland
            </p>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-4/5" />
              </Card>
            ))}
          </div>
        ) : displayJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/jobs/${job.id}`}>
                  <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      {job.is_featured && (
                        <div className="flex items-center gap-1 text-accent text-xs font-semibold mb-3">
                          <Star className="w-3.5 h-3.5 fill-accent" />
                          FEATURED
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors mb-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company_name}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {job.short_description || job.description?.slice(0, 120)}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.location}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {jobTypeLabels[job.job_type] || job.job_type}
                        </Badge>
                      </div>
                      {(job.salary_min || job.salary_max) && (
                        <p className="text-sm font-semibold text-accent">
                          €{job.salary_min?.toLocaleString()}{job.salary_max ? ` - €${job.salary_max.toLocaleString()}` : "+"}
                          {job.salary_period && ` / ${job.salary_period}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No jobs posted yet. Be the first employer to post!</p>
            <Link to="/employers">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Post a Job</Button>
            </Link>
          </div>
        )}

        {displayJobs.length > 0 && (
          <div className="text-center mt-10">
            <Link to="/jobs">
              <Button variant="outline" className="group">
                View All Jobs
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}