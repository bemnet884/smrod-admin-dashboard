'use client';

import { useHospitalAlerts } from '@/hooks/useHospitalAlerts';
import { Badge } from '@/components/ui/badge';
import { Siren } from 'lucide-react';

interface Props {
  hospitalId: string;
}

export function HospitalAlertFeed({ hospitalId }: Props) {

  const { alerts, connected } = useHospitalAlerts(hospitalId);

  return (<div className="rounded-2xl border bg-card p-4 space-y-4">


    <div className="flex items-center justify-between">
      <p className="font-semibold text-sm">Live Accident Alerts</p>

      <Badge variant={connected ? 'secondary' : 'destructive'}>
        {connected ? 'Connected' : 'Offline'}
      </Badge>
    </div>

    <div className="space-y-3 max-h-[260px] overflow-auto">

      {alerts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No alerts yet
        </p>
      )}

      {alerts.map((a, i) => (
        <div
          key={i}
          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1"
        >
          <div className="flex items-center gap-2 font-semibold text-red-500">
            <Siren className="w-4 h-4" />
            Accident Detected
          </div>

          <p>Vehicle: {a.vehicleId}</p>
          <p>Distance: {a.distance?.toFixed(2)} km</p>
          <p className="text-muted-foreground">
            {new Date(a.createdAt).toLocaleString()}
          </p>
        </div>
      ))}

    </div>

  </div>


  );
}
