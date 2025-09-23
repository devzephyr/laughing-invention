"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getLowPower, setLowPower } from "@/components/background/low-power";

export function LowPowerToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(getLowPower());
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="low-power"
        checked={enabled}
        onCheckedChange={(v) => {
          setEnabled(!!v);
          setLowPower(!!v);
        }}
      />
      <Label htmlFor="low-power" className="text-sm">Low power</Label>
    </div>
  );
}

