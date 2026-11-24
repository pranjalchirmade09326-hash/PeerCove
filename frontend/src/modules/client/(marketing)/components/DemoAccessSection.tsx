/**
 * Demo Access Section for Landing Page
 * Showcases demo accounts and provides quick access to explore MindSpace
 */

"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function DemoAccessSection() {
  const demoRoles = [
    {
      title: "Member Experience",
      description: "Personal dashboard, mood tracking, journal, support sessions",
      emoji: "👩‍💼",
      color: "from-emerald-500 to-teal-600",
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Listener Experience",
      description: "Support conversations, ratings, availability, specialties",
      emoji: "🎧",
      color: "from-cyan-500 to-blue-600",
      gradient: "bg-gradient-to-br from-cyan-50 to-blue-50",
      borderColor: "border-cyan-200",
    },
    {
      title: "Admin Dashboard",
      description: "Platform analytics, user management, system monitoring",
      emoji: "👨‍💻",
      color: "from-purple-500 to-pink-600",
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-white to-slate-50 py-20 sm:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute left-1/4 bottom-0 w-72 h-72 bg-cyan-100/20 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100">
            <Sparkles className="size-4" />
            Instant Access
          </Badge>

          <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Explore PeerCove in seconds
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            No setup required. Sign in with pre-configured demo accounts to experience all
            PeerCove features across different user roles.
          </p>
        </motion.div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {demoRoles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`border-2 ${role.borderColor} ${role.gradient} h-full`}>
                <CardHeader className="pb-3">
                  <div className="text-4xl mb-2">{role.emoji}</div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-slate-600 mb-4">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              What's Included
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ Full access to all user dashboards</li>
              <li>✓ Pre-populated demo data</li>
              <li>✓ No credit card required</li>
              <li>✓ Instant sign-in, no setup</li>
              <li>✓ Persistent data across sessions</li>
              <li>✓ Test all features simultaneously</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Perfect For
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Product demonstrations</li>
              <li>• Proof-of-concept testing</li>
              <li>• Feature exploration</li>
              <li>• Integration testing</li>
              <li>• Stakeholder demos</li>
              <li>• Developer onboarding</li>
            </ul>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/demo-login">
            <Button
              size="lg"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-8"
            >
              <Globe className="mr-2 size-4" />
              Try Demo Accounts
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>

          <Link href="/signup">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-slate-300 px-8"
            >
              Create Real Account
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"
        >
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Demo accounts are perfect for exploring all features without
            commitment. All data is shared and persistent for your testing convenience.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
