import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCreatePet,
  useUpdatePet,
  useCreateDocumentImport,
  ApiError,
  type Pet,
  type PetInput,
  type DocumentImportItem,
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, CloudUpload, Upload, FileText, Pill, Bell, Stethoscope, Sparkles, HeartPulse } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { resolvePetAvatar } from '@/lib/pet-avatar';
import { SPECIES_OPTIONS } from '@/lib/pet-species';
import { onboardingSchema, ONBOARDING_FORM_DEFAULTS, type OnboardingFormValues } from '@/lib/onboarding-form-schema';

const fieldClass = 'h-12 rounded-2xl bg-accent/40';

// Condensed icon/label lookup for the "also found" preview list — same
// shape as onboarding-chat.tsx's own copy, kept separate rather than
// shared since each file renders it in its own layout (a chat bubble vs. a
// form-page card).
const ITEM_TYPE_META: Record<DocumentImportItem['itemType'], { icon: typeof FileText; label: (d: Record<string, unknown>) => string; sub: (d: Record<string, unknown>) => string }> = {
  health_record: { icon: FileText, label: (d) => String(d.title ?? 'Health record'), sub: (d) => String(d.type ?? '') },
  medication: { icon: Pill, label: (d) => String(d.name ?? 'Medication'), sub: (d) => [d.dose, d.frequency].filter(Boolean).join(' · ') },
  reminder: { icon: Bell, label: (d) => String(d.title ?? 'Reminder'), sub: (d) => String(d.dueDate ?? '') },
  vet_info: { icon: Stethoscope, label: () => 'Vet contact', sub: (d) => String(d.vetClinic ?? d.vetName ?? '') },
};

// vet_info's proposedData only ever carries fields that differ from what's
// already on the pet's profile — breed/weight/weightUnit/sex/vet contact.
// Never birthDate/gotchaDate (a vet report rarely states a reliable exact
// birthday), so that field is never live-filled here, unlike the others.
const VET_INFO_FIELD_KEYS: (keyof OnboardingFormValues)[] = ['breed', 'weight', 'weightUnit', 'sex', 'vetName', 'vetClinic', 'vetPhone', 'vetAddress'];

function toPetInput(values: OnboardingFormValues): PetInput {
  return {
    ...values,
    photoUrl: null,
    spayNeuterStatus: 'unknown',
    birthDate: values.birthDate || null,
    breed: values.breed || null,
    notes: values.notes || null,
    vetName: values.vetName || null,
    vetClinic: values.vetClinic || null,
    vetPhone: values.vetPhone || null,
    vetAddress: values.vetAddress || null,
    weight: values.weight === null || values.weight === undefined || (values.weight as unknown) === '' ? null : Number(values.weight),
  };
}

function FromReportBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
      <Sparkles size={10} /> From report
    </span>
  );
}

export function OnboardingA2Form({
  onBack,
  onDone,
  onNeedsReview,
}: {
  onBack: () => void;
  onDone: (pet: Pet) => void;
  onNeedsReview: (pet: Pet) => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [petId, setPetId] = useState<number | null>(null);
  const [filled, setFilled] = useState<Partial<Record<keyof OnboardingFormValues, boolean>>>({});
  const [uploadState, setUploadState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<DocumentImportItem[]>([]);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: ONBOARDING_FORM_DEFAULTS,
  });

  const createPet = useCreatePet({
    mutation: {
      onError: (error) => toast({ title: "Couldn't add your pet", description: error.message, variant: 'destructive' }),
    },
  });
  const updatePet = useUpdatePet({
    mutation: {
      onError: (error) => toast({ title: "Couldn't save that", description: error.message, variant: 'destructive' }),
    },
  });
  const createImport = useCreateDocumentImport();

  const selectedSpecies = form.watch('species');
  const avatarSrc = resolvePetAvatar(null, selectedSpecies);

  // The actual pet-creation gate lives here (in the file input's own
  // onChange) rather than in the "Choose a file" button's onClick — the
  // button's click just has to synchronously call fileInputRef.click() so
  // the browser treats opening the native picker as part of the same user
  // gesture (an async await before it can silently get blocked as a
  // pop-up). Gating on the file actually being selected means it also
  // works correctly for any other way a file could land in that input.
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File is too large', description: 'Maximum size is 10MB.', variant: 'destructive' });
      return;
    }

    let currentPetId = petId;
    if (!currentPetId) {
      const valid = await form.trigger('name');
      if (!valid) return;
      try {
        const created = await createPet.mutateAsync({ data: toPetInput(form.getValues()) });
        currentPetId = created.id;
        setPetId(created.id);
      } catch {
        return;
      }
    }

    setUploadState('busy');
    setFileName(file.name);
    createImport.mutate(
      { petId: currentPetId, data: { file } },
      {
        onSuccess: (data) => {
          const vetInfoItem = data.import.items.find((i) => i.itemType === 'vet_info');
          if (vetInfoItem) {
            const d = vetInfoItem.proposedData as Record<string, unknown>;
            const newFilled: typeof filled = {};
            VET_INFO_FIELD_KEYS.forEach((key) => {
              if (d[key] !== undefined && d[key] !== null) {
                form.setValue(key, d[key] as never, { shouldDirty: true });
                newFilled[key] = true;
              }
            });
            setFilled(newFilled);
          }
          setReviewItems(data.import.items.filter((i) => i.itemType !== 'vet_info' && i.status === 'pending'));
          setUploadState('done');
        },
        onError: (error) => {
          setUploadState('idle');
          setFileName(null);
          const message =
            error instanceof ApiError && error.data && typeof error.data === 'object' && 'error' in error.data
              ? String((error.data as { error: unknown }).error)
              : error.message;
          toast({ title: "Couldn't read that file", description: message, variant: 'destructive' });
        },
      },
    );
  };

  const clearUpload = () => {
    (Object.keys(filled) as (keyof OnboardingFormValues)[]).forEach((key) => {
      if (key === 'sex') form.setValue('sex', 'unknown');
      else if (key === 'weight') form.setValue('weight', null);
      else if (key === 'weightUnit') form.setValue('weightUnit', 'lb');
      else form.setValue(key, '');
    });
    setFilled({});
    setUploadState('idle');
    setFileName(null);
    setReviewItems([]);
  };

  const handleContinue = async () => {
    const valid = await form.trigger('name');
    if (!valid) return;
    const values = form.getValues();

    if (!petId) {
      createPet.mutate({ data: toPetInput(values) }, { onSuccess: (created) => onDone(created) });
      return;
    }
    updatePet.mutate(
      { petId, data: toPetInput(values) },
      {
        onSuccess: (updated) => {
          if (reviewItems.length > 0) onNeedsReview(updated);
          else onDone(updated);
        },
      },
    );
  };

  const busy = createPet.isPending || updatePet.isPending;

  return (
    <div className="min-h-[100dvh] px-6 py-10 md:py-14">
      <div className="w-full max-w-5xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-serif text-[28px] font-extrabold tracking-tight">Let's add your pet</h1>
        <p className="mt-1 mb-6 text-[16px] text-muted-foreground">
          Type it in, or drop a vet report and we'll fill the form in for you.
        </p>

        <div className="flex flex-wrap-reverse gap-6 items-start">
          <div className="flex-1 min-w-[280px] flex flex-col gap-3">
            {uploadState === 'idle' && (
              <div className="bg-card border-2 border-dashed border-border rounded-3xl p-7 text-center">
                <div className="w-14 h-14 rounded-full bg-accent text-primary flex items-center justify-center mx-auto mb-3.5">
                  <CloudUpload size={26} />
                </div>
                <div className="font-serif text-lg font-extrabold">Drop a vet report here</div>
                <p className="text-sm text-muted-foreground mt-1.5 mb-4">
                  We'll fill in the form as we read it. You can change anything after.
                </p>
                <button
                  type="button"
                  onClick={handleChooseFile}
                  disabled={createPet.isPending}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Upload size={18} /> Choose a file
                </button>
                <p className="text-xs text-muted-foreground mt-3.5">PDF or photo, up to 10MB and 20 pages.</p>
              </div>
            )}
            {uploadState !== 'idle' && (
              <div className="bg-card border border-border rounded-3xl p-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-accent text-primary flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold truncate">{fileName}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {uploadState === 'busy'
                        ? 'Reading…'
                        : `Filled ${Object.values(filled).filter(Boolean).length} field${Object.values(filled).filter(Boolean).length === 1 ? '' : 's'} from the report`}
                    </div>
                  </div>
                </div>
                {uploadState === 'done' && reviewItems.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                      Also found · you'll check these next
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {reviewItems.map((item) => {
                        const meta = ITEM_TYPE_META[item.itemType];
                        const Icon = meta.icon;
                        const d = item.proposedData as Record<string, unknown>;
                        return (
                          <div key={item.id} className="flex items-center gap-2.5 bg-accent/40 rounded-xl px-2.5 py-2">
                            <div className="w-7 h-7 rounded-lg bg-card text-primary flex items-center justify-center shrink-0">
                              <Icon size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold truncate">{meta.label(d)}</div>
                              <div className="text-xs text-muted-foreground truncate">{meta.sub(d)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {uploadState === 'done' && (
                  <button type="button" onClick={clearUpload} className="mt-3 text-xs font-bold text-destructive">
                    Remove report &amp; clear filled fields
                  </button>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex-[1.4] min-w-[320px]">
            <Form {...form}>
              <div className="bg-card border border-border rounded-3xl p-7 flex flex-col gap-5">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-primary shrink-0 overflow-hidden">
                    {avatarSrc ? <img src={avatarSrc} alt="Pet avatar" className="w-full h-full object-cover" /> : <HeartPulse size={28} />}
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="flex items-center gap-2">Name {filled.name && <FromReportBadge />}</FormLabel>
                        <FormControl>
                          <Input placeholder="Pet's name" className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">Species {filled.species && <FromReportBadge />}</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIES_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => form.setValue('species', option.value, { shouldDirty: true })}
                        className={cnChip(selectedSpecies === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">Sex {filled.sex && <FromReportBadge />}</Label>
                  <div className="flex gap-1 bg-accent/60 border border-border rounded-2xl p-1">
                    {(['female', 'male', 'unknown'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => form.setValue('sex', value, { shouldDirty: true })}
                        className={cnSexOption(form.watch('sex') === value)}
                      >
                        {value === 'female' ? 'Female' : value === 'male' ? 'Male' : 'Unknown'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">Breed {filled.breed && <FromReportBadge />}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Golden Retriever" className={fieldClass} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday or gotcha day</FormLabel>
                        <FormControl>
                          <Input type="date" className={fieldClass} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">Weight ({form.watch('weightUnit')}) {filled.weight && <FromReportBadge />}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" className={fieldClass} {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vetName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">Vet {filled.vetName && <FromReportBadge />}</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Jamie Rivera" className={fieldClass} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vetClinic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">Clinic {filled.vetClinic && <FromReportBadge />}</FormLabel>
                        <FormControl>
                          <Input placeholder="Harbor Veterinary Clinic" className={fieldClass} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vetPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">Phone {filled.vetPhone && <FromReportBadge />}</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" className={fieldClass} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Form>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleContinue()}
              className="mt-6 w-full h-[52px] flex items-center justify-center gap-2.5 rounded-full bg-primary text-primary-foreground font-extrabold shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cnChip(active: boolean): string {
  return [
    'h-10 px-3.5 rounded-full border text-sm font-bold transition-colors',
    active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:border-primary/40',
  ].join(' ');
}

function cnSexOption(active: boolean): string {
  return [
    'flex-1 h-9 rounded-xl text-sm font-bold transition-colors',
    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
  ].join(' ');
}
