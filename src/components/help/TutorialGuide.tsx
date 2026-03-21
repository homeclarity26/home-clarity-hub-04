import type { Tutorial } from "@/data/tutorials/types";

interface TutorialGuideProps {
  tutorial: Tutorial;
}

const TutorialGuide = ({ tutorial }: TutorialGuideProps) => (
  <div className="space-y-3">
    <p className="text-xs font-sans text-muted-foreground">{tutorial.description}</p>
    {tutorial.steps.map((step, i) => (
      <div key={i} className="flex gap-3">
        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
          {i + 1}
        </span>
        <div>
          <p className="text-xs font-sans text-foreground font-medium">{step.title}</p>
          <p className="text-xs font-sans text-muted-foreground">{step.body}</p>
        </div>
      </div>
    ))}
    {tutorial.tip && (
      <div className="border-l-[3px] border-l-accent bg-accent/5 rounded-r-md p-3 mt-2">
        <p className="text-xs font-sans text-foreground">
          <span className="font-semibold text-accent">Tip:</span> {tutorial.tip}
        </p>
      </div>
    )}
  </div>
);

export default TutorialGuide;
