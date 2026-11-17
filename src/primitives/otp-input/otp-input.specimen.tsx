import { useState } from "react";
import { OtpInput } from "./otp-input";

export function OtpInputSpecimen() {
  const [value, setValue] = useState("123");
  return (
    <div className="flex w-80 flex-col gap-3 p-4">
      <OtpInput value={value} onChange={setValue} />
      <OtpInput value="123456" onChange={() => {}} invalid />
      <OtpInput value="" onChange={() => {}} disabled />
    </div>
  );
}
