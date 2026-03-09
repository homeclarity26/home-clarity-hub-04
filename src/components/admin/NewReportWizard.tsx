import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, CheckCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

const steps = ["Client Info", "Upload Data", "AI Generation", "Review & Publish"];

const NewReportWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${
              i === currentStep ? "bg-primary text-primary-foreground font-medium" :
              i < currentStep ? "bg-primary/10 text-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current/20">
                {i < currentStep ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 0 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Full Name</Label>
              <Input placeholder="Sarah & Michael Johnson" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Email</Label>
              <Input type="email" placeholder="client@email.com" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Phone</Label>
              <Input placeholder="(330) 555-0142" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Property Address</Label>
              <Input placeholder="445 Elm Street, Hudson, OH 44236" className="font-sans" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Year Built</Label>
              <Input type="number" placeholder="1998" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Sq Ft</Label>
              <Input type="number" placeholder="3200" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Bedrooms</Label>
              <Input type="number" placeholder="4" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Bathrooms</Label>
              <Input type="number" placeholder="3" className="font-sans" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Discovery Call Notes</Label>
            <textarea
              placeholder="Key notes from the initial consultation..."
              className="w-full h-24 px-3 py-2 rounded-md border border-border text-sm font-sans bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Upload Data</h3>
          {[
            "Discovery Call Recording",
            "Walkthrough Transcript",
            "Exterior Photos",
            "Interior Photos",
            "Serial Plate Photos",
            "hover.to Files",
            "External Reports",
          ].map((category) => (
            <div key={category} className="border border-dashed border-border rounded-lg p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-sans font-medium text-foreground">{category}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">
                Drag & drop or click to upload
              </p>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">iGuide.com Link</Label>
            <Input placeholder="https://youriguide.com/..." className="font-sans" />
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">AI Report Generation</h3>
          {!generating && !generated && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
              <p className="text-sm font-sans text-foreground mb-2">
                AI will analyze your uploaded data and generate initial report content
              </p>
              <p className="text-xs font-sans text-muted-foreground mb-6">
                This typically takes 2-5 minutes depending on the amount of data
              </p>
              <Button onClick={handleGenerate} className="gap-2 font-sans">
                <Sparkles className="w-4 h-4" />
                Generate Report Content
              </Button>
            </div>
          )}
          {generating && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-sm font-sans text-foreground mb-2">Generating report content...</p>
              <div className="max-w-sm mx-auto space-y-2 mt-6">
                {["Analyzing discovery call transcript", "Processing property photos", "Generating room narratives", "Building pricing recommendations"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    {i < 2 ? (
                      <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                    )}
                    <span className={`text-xs font-sans ${i < 2 ? "text-foreground" : "text-muted-foreground"}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {generated && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-foreground mx-auto mb-4" />
              <p className="text-sm font-sans text-foreground mb-2">Report content generated!</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge className="bg-primary/10 text-foreground text-xs font-sans border-none">18 pages generated</Badge>
                <Badge className="bg-accent/20 text-accent-foreground text-xs font-sans border-none">4 flagged for review</Badge>
                <Badge className="bg-muted text-muted-foreground text-xs font-sans border-none">2 inactive</Badge>
              </div>
            </div>
          )}
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Review & Publish</h3>
          <p className="text-sm font-sans text-muted-foreground">
            Review the generated content in the portal before publishing. Publishing will create the client account and send login credentials.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-1.5 font-sans" onClick={() => window.open("/portal/prop-new?edit=true", "_blank")}>
              Open in Portal to Review
            </Button>
            <Button className="gap-1.5 font-sans">
              <CheckCircle className="w-4 h-4" />
              Publish v1
            </Button>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep === 0 ? navigate("/admin/clients") : setCurrentStep(currentStep - 1)}
          className="gap-1.5 font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 0 ? "Cancel" : "Back"}
        </Button>
        {currentStep < steps.length - 1 && (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="gap-1.5 font-sans"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewReportWizard;
