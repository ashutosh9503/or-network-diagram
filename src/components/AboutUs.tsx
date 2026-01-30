
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, User, Code, GraduationCap, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AboutUs() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hidden md:flex">
                    <Info className="h-4 w-4" />
                    About Us
                </Button>
            </DialogTrigger>

            {/* Mobile trigger icon only */}
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Info className="h-5 w-5" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="px-6 py-4 border-b bg-muted/20">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-1.5 rounded-md bg-gradient-to-tr from-sky-600 to-indigo-600 text-white">
                            <Info className="h-4 w-4" />
                        </div>
                        About OR Network Diagram Generator
                    </DialogTitle>
                    <DialogDescription>
                        Educational tools for Operations Research students & faculty
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Project Description */}
                        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Laptop className="h-4 w-4 text-sky-500" />
                                Project Overview
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                This application is designed to help students and faculty visualize complex Operations Research concepts.
                                It specializes in <strong>CPM (Critical Path Method)</strong> and <strong>PERT (Program Evaluation and Review Technique)</strong>,
                                providing interactive network diagrams, automatic critical path calculation, and detailed analysis tables.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Badge variant="secondary" className="bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200">
                                    Automatic Analysis
                                </Badge>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                    Interactive Diagrams
                                </Badge>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                    Export Capabilities
                                </Badge>
                            </div>
                        </section>

                        {/* Creator Card */}
                        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                                <User className="h-4 w-4 text-indigo-500" />
                                Developed By
                            </h3>

                            <Card className="bg-gradient-to-br from-background to-muted/50 border-muted-foreground/10 overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="bg-muted/30 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-border min-w-[140px]">
                                            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-lg ring-4 ring-background">
                                                AM
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold">Ashutosh Mishra</div>
                                                <div className="text-xs text-muted-foreground">B.Sc. IT Student</div>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-4 flex-1">
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-start gap-2 text-sm">
                                                    <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    <span>
                                                        <span className="font-medium text-foreground">Focus Areas:</span>{" "}
                                                        <span className="text-muted-foreground">Operations Research, Web Development, UI/UX Design</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2 text-sm">
                                                    <Code className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    <span>
                                                        <span className="font-medium text-foreground">Tech Stack:</span>{" "}
                                                        <span className="text-muted-foreground">React, TypeScript, Tailwind CSS, shadcn/ui</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-background/50 rounded-lg p-3 text-sm italic text-muted-foreground border border-border/50">
                                                "My goal is building practical academic tools that bridge the gap between theory and application for students."
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Highlights */}
                        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {["Student Project", "Open Source", "Deployed on Vercel", "Academic Tool"].map((badge, i) => (
                                    <div key={i} className="text-xs font-medium text-center p-2 rounded-md bg-muted/40 border text-muted-foreground">
                                        {badge}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/10 text-center">
                    <p className="text-xs text-muted-foreground">
                        .
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
