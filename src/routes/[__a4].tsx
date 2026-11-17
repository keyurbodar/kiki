import { createFileRoute } from "@tanstack/react-router";
import { ButtonSpecimen } from "@/primitives/button/button.specimen";
import { InputSpecimen } from "@/primitives/input/input.specimen";
import { KbdSpecimen } from "@/primitives/kbd/kbd.specimen";
import { LabelSpecimen } from "@/primitives/label/label.specimen";
import { TextareaSpecimen } from "@/primitives/textarea/textarea.specimen";

export const Route = createFileRoute("/__a4")({
  component: () => (
    <div className="bg-background text-foreground">
      <div id="button"><ButtonSpecimen /></div>
      <div id="input"><InputSpecimen /></div>
      <div id="textarea"><TextareaSpecimen /></div>
      <div id="label"><LabelSpecimen /></div>
      <div id="kbd"><KbdSpecimen /></div>
    </div>
  ),
});
