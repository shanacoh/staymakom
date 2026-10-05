/**
 * Composants UI partagés, stylés selon la maquette
 * docs/claude/maquettes/maquette-refonte-fiche-et-backoffice.html (onglet
 * « 1. Back-office ») — sprint 5B.
 *
 * Ce sont des doublures purement visuelles des composants @/components/ui/* :
 * mêmes props, même comportement, seules les classes Tailwind par défaut
 * changent (tailles, couleurs, rayons). Les écrans qui importent les
 * composants @/components/ui/* directement ne voient aucun changement.
 *
 * Utilisés par StandaloneExperienceForm.tsx et AiDraftPanel.tsx ; prévus pour
 * être réutilisés tels quels par le formulaire hôtel (prochain sprint).
 */

import { forwardRef } from "react";
import { Button as UiButton, type ButtonProps } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea as UiTextarea } from "@/components/ui/textarea";
import {
  Card as UiCard,
  CardContent as UiCardContent,
  CardDescription as UiCardDescription,
  CardHeader as UiCardHeader,
  CardTitle as UiCardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, React.ComponentProps<typeof UiLabel>>(({ className, ...props }, ref) => (
  <UiLabel ref={ref} className={cn("text-[11px] uppercase tracking-[0.05em] text-[#6f6a63] font-medium", className)} {...props} />
));
Label.displayName = "Label";

export const Input = forwardRef<HTMLInputElement, React.ComponentProps<typeof UiInput>>(({ className, ...props }, ref) => (
  <UiInput ref={ref} className={cn("h-9 rounded-[9px] border-[#e9e6e1] px-2.5 py-2 text-[13px]", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<typeof UiTextarea>>(({ className, ...props }, ref) => (
  <UiTextarea ref={ref} className={cn("rounded-[9px] border-[#e9e6e1] px-2.5 py-2 text-[13px]", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
  <UiButton ref={ref} className={cn("h-[34px] rounded-[10px] text-[13px] normal-case tracking-normal", className)} {...props} />
));
Button.displayName = "Button";

export const Card = forwardRef<HTMLDivElement, React.ComponentProps<typeof UiCard>>(({ className, ...props }, ref) => (
  <UiCard ref={ref} className={cn("rounded-[14px] border-[#e9e6e1] shadow-none", className)} {...props} />
));
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.ComponentProps<typeof UiCardHeader>>(({ className, ...props }, ref) => (
  <UiCardHeader ref={ref} className={cn("space-y-1 p-3", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<HTMLDivElement, React.ComponentProps<typeof UiCardContent>>(({ className, ...props }, ref) => (
  <UiCardContent ref={ref} className={cn("space-y-2.5 p-3 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardTitle = forwardRef<HTMLParagraphElement, React.ComponentProps<typeof UiCardTitle>>(({ className, ...props }, ref) => (
  <UiCardTitle ref={ref} className={cn("text-[14px] font-bold leading-tight tracking-normal text-[#1a1814]", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.ComponentProps<typeof UiCardDescription>>(({ className, ...props }, ref) => (
  <UiCardDescription ref={ref} className={cn("text-xs text-[#6f6a63]", className)} {...props} />
));
CardDescription.displayName = "CardDescription";
