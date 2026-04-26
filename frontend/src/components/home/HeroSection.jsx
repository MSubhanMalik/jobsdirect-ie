import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

export default function HeroSection() {
  const navigate = useNavigate();
  const { appPublicSettings } = useAuth();
  const settings = appPublicSettings?.public_settings || {};
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    if (jobType) params.set("type", jobType);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              {settings.hero_eyebrow || "Ireland's Leading Job Platform"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6"
          >
            {settings.hero_title || "Find Your Dream Job or Hire Top Talent"}{" "}
            <span className="text-accent">{settings.hero_highlight || "in Ireland"}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto"
          >
            {settings.hero_subtitle || "Connect with thousands of employers and job seekers across Ireland. Your next opportunity is just a search away."}
          </motion.p>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSearch}
            className="bg-card/10 backdrop-blur-md rounded-2xl p-3 border border-primary-foreground/10"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <Input
                  placeholder="Job title or keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-10 bg-primary-foreground/10 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 h-12"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40 z-10" />
                <Input
                  placeholder="Location (e.g. Dublin)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 bg-primary-foreground/10 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 h-12"
                />
              </div>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/10 text-primary-foreground h-12 w-full sm:w-44">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 font-semibold"
              >
                <Search className="w-4 h-4 mr-2" />
                {settings.primary_cta || "Search"}
              </Button>
            </div>
          </motion.form>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <Button
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 group"
              onClick={() => navigate("/employers")}
            >
              {settings.employer_cta || "Post a Job"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <span className="text-sm text-primary-foreground/50">or</span>
            <Button
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 group"
              onClick={() => navigate("/employees")}
            >
              Create Your Profile
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
