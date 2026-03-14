"use client";

import React, { useState, useCallback, useEffect } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";

export interface WizardStepProps {
  data: Record<string, unknown>;
  updateData: (data: Record<string, unknown>) => void;
  onNext?: () => void;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<WizardStepProps>;
  validate?: () => Promise<boolean> | boolean;
}

interface MultiStepWizardProps {
  steps: WizardStep[];
  onComplete: (data: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: Record<string, unknown>;
  persistKey?: string; // localStorage key for state persistence
  className?: string;
}

export const MultiStepWizard: React.FC<MultiStepWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  initialData = {},
  persistKey,
  className = "",
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] =
    useState<Record<string, unknown>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Load persisted data on mount
  useEffect(() => {
    if (persistKey) {
      try {
        const saved = localStorage.getItem(persistKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error("Failed to load persisted wizard state:", error);
      }
    }
  }, [persistKey]);

  // Persist data on changes
  useEffect(() => {
    if (persistKey && Object.keys(formData).length > 0) {
      try {
        localStorage.setItem(persistKey, JSON.stringify(formData));
      } catch (error) {
        console.error("Failed to persist wizard state:", error);
      }
    }
  }, [formData, persistKey]);

  const updateFormData = useCallback((stepData: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = async () => {
    // Validate current step if validation function exists
    if (currentStep.validate) {
      const isValid = await currentStep.validate();
      if (!isValid) {
        return;
      }
    }

    if (isLastStep) {
      // Submit form
      setIsSubmitting(true);
      try {
        await onComplete(formData);
        // Clear persisted data on successful completion
        if (persistKey) {
          localStorage.removeItem(persistKey);
        }
      } catch (error) {
        console.error("Wizard submission failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Move to next step
      setDirection("forward");
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setDirection("backward");
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCancel = () => {
    if (persistKey) {
      // Optionally clear persisted data on cancel
      const shouldClear = window.confirm(
        "Are you sure you want to cancel? Your progress will be lost.",
      );
      if (shouldClear) {
        localStorage.removeItem(persistKey);
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Arrow key navigation
    if (e.key === "ArrowRight" && !isLastStep && e.ctrlKey) {
      e.preventDefault();
      handleNext();
    } else if (e.key === "ArrowLeft" && !isFirstStep && e.ctrlKey) {
      e.preventDefault();
      handleBack();
    }
  };

  const slideVariants = {
    enter: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div
      className={`wizard-container ${className}`}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Multi-step form wizard"
    >
      {/* Progress Indicator */}
      <div
        className="wizard-progress mb-8"
        role="progressbar"
        aria-valuenow={currentStepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        {/* Mobile: Compact Progress Bar */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium dark:text-white/70 text-gray-600">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-xs dark:text-white/50 text-gray-400">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full dark:bg-white/10 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm font-medium dark:text-blue-400 text-blue-600 mt-2">
            {currentStep.title}
          </p>
          {currentStep.description && (
            <p className="text-xs dark:text-white/50 text-gray-400">
              {currentStep.description}
            </p>
          )}
        </div>

        {/* Desktop: Full Step Indicators */}
        <div className="hidden md:flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300 font-semibold text-sm
                      ${
                        isCompleted
                          ? "dark:bg-blue-600 dark:text-white bg-blue-200 text-blue-700"
                          : isCurrent
                            ? "dark:bg-blue-500 dark:text-white dark:ring-4 dark:ring-blue-500/30 bg-blue-100 text-blue-700 ring-4 ring-blue-300/50"
                            : "dark:bg-white/10 dark:text-white/50 bg-gray-200 text-gray-500"
                      }
                    `}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <Check aria-label="Completed" />
                    ) : (
                      <span aria-label={`Step ${index + 1}`}>{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent
                          ? "dark:text-blue-400 text-blue-700"
                          : "dark:text-white/60 text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs dark:text-white/50 text-gray-400 mt-1 hidden lg:block">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-2 rounded
                      transition-all duration-300
                      ${isCompleted ? "dark:bg-blue-600 bg-blue-300" : "dark:bg-white/10 bg-gray-300"}
                    `}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-content overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={currentStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="relative px-1"
          >
            <currentStep.component
              data={formData}
              updateData={updateFormData}
              onNext={handleNext}
            />
          </m.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-navigation flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-6 border-t dark:border-white/10 border-gray-200">
        <div className="order-2 sm:order-1">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
              aria-label="Cancel wizard"
              className="w-full sm:w-auto"
            >
              <X className="mr-2" />
              Cancel
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
          {!isFirstStep && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isSubmitting}
              aria-label="Go to previous step"
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="mr-2" />
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            disabled={isSubmitting}
            aria-label={isLastStep ? "Submit form" : "Go to next step"}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : isLastStep ? (
              <>
                <Check className="mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div
        className="text-xs dark:text-white/50 text-gray-500 mt-4 text-center hidden md:block"
        aria-live="polite"
      >
        <span>Tip: Use Ctrl + Arrow keys to navigate between steps</span>
      </div>
    </div>
  );
};
