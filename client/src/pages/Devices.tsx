import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Smartphone, Plus, Unlock, Wifi, WifiOff, Battery } from 'lucide-react';
import { Device } from '../types';

export default function Devices() {
  const [showPairForm, setShowPairForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceAPI.list(),
  });

  const pairDeviceMutation = useMutation({
    mutationFn: ({ mac, name }: { mac: string; name: string }) =>
      deviceAPI.pair(mac, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setShowPairForm(false);
    },
  });

  const requestUnlockMutation = useMutation({
    mutationFn: (deviceId: string) => deviceAPI.requestUnlock(deviceId),
  });

  const handlePairDevice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    pairDeviceMutation.mutate({
      mac: formData.get('macAddress') as string,
      name: formData.get('name') as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-muted-foreground">
            Manage your ESP32 lock devices
          </p>
        </div>
        <Button onClick={() => setShowPairForm(!showPairForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Pair Device
        </Button>
      </div>

      {showPairForm && (
        <Card>
          <CardHeader>
            <CardTitle>Pair New Device</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePairDevice} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Bedroom Phone Lock"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address *</Label>
                <Input
                  id="macAddress"
                  name="macAddress"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Check the ESP32 serial monitor to find the MAC address
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pairDeviceMutation.isPending}>
                  Pair Device
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPairForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No devices paired</p>
              <p className="text-sm text-muted-foreground">
                Pair your first ESP32 device to get started
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {devices.map((device: Device) => (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {device.macAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status === 'online' ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Lock State</p>
                    <p className="font-medium capitalize">{device.lockState}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Firmware</p>
                    <p className="font-medium">v{device.firmwareVersion}</p>
                  </div>
                  {device.batteryLevel && (
                    <div>
                      <p className="text-muted-foreground">Battery</p>
                      <div className="flex items-center gap-1">
                        <Battery className="h-4 w-4" />
                        <p className="font-medium">{device.batteryLevel}%</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => requestUnlockMutation.mutate(device.id)}
                  disabled={device.status !== 'online'}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Request Unlock
                </Button>
                {requestUnlockMutation.data && (
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Unlock Code:</p>
                    <p className="text-3xl font-mono font-bold tracking-wider">
                      {requestUnlockMutation.data.unlockCode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires in {Math.floor(requestUnlockMutation.data.expiresIn / 60)} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
