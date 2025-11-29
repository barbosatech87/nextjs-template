"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ConsentSettings } from '@/hooks/use-cookie-consent';
import { Locale } from '@/lib/i18n/config';
import { ShieldCheck, BarChart, ShoppingBag } from 'lucide-react';
import { getCookieSettingsDictionary } from '@/lib/i18n/dictionaries/cookie-settings';

interface CookieSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConsent: ConsentSettings;
  onSave: (settings: ConsentSettings) => void;
  lang: Locale;
}

export function CookieSettingsDialog({ open, onOpenChange, currentConsent, onSave, lang }: CookieSettingsDialogProps) {
  const t = getCookieSettingsDictionary(lang);
  const [settings, setSettings] = useState<ConsentSettings>(currentConsent);

  // Sincroniza o estado local quando o modal abre ou as props mudam
  useEffect(() => {
    setSettings(currentConsent);
  }, [currentConsent, open]);

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Essenciais */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <Label htmlFor="necessary" className="text-base font-semibold">{t.necessary.title}</Label>
              </div>
              <Switch id="necessary" checked={true} disabled />
            </div>
            <p className="text-sm text-muted-foreground ml-7">{t.necessary.desc}</p>
          </div>

          {/* Analíticos */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart className="h-5 w-5 text-blue-600" />
                <Label htmlFor="analytics" className="text-base font-semibold">{t.analytics.title}</Label>
              </div>
              <Switch 
                id="analytics" 
                checked={settings.analytics} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, analytics: checked }))}
              />
            </div>
            <p className="text-sm text-muted-foreground ml-7">{t.analytics.desc}</p>
          </div>

          {/* Marketing */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
                <Label htmlFor="marketing" className="text-base font-semibold">{t.marketing.title}</Label>
              </div>
              <Switch 
                id="marketing" 
                checked={settings.marketing} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, marketing: checked }))}
              />
            </div>
            <p className="text-sm text-muted-foreground ml-7">{t.marketing.desc}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={handleSave}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}