import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Check, Upload, FileText, LogOut, AlertCircle, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';
import { createStudentProfile } from '@/lib/student-context';
import { extractPdfText, parseGradesToJSON, extractStudentInfo } from '@/lib/ai-agent';

type OnboardingStep = 'type-selection' | 'basic' | 'academic' | 'verification' | 'lifestyle';
type StudentType = 'international' | 'local';

interface OnboardingProps {
    onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState<OnboardingStep>('type-selection');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{ match: boolean; message: string } | null>(null);

    const [formData, setFormData] = useState({
        studentType: '' as StudentType,
        firstName: '',
        lastName: '',
        studentId: '',
        major: '',
        graduationDate: '',
        housingType: 'dorm',
        mealPlan: 'three_meal',
        dormRoomType: 'double',
        gpa: 0.0
    });

    const [files, setFiles] = useState<{ bulletin?: File; transcript?: File }>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bulletin' | 'transcript') => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [type]: e.target.files[0] });
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const validateBasicInfo = () => {
        if (!formData.firstName || !formData.lastName) {
            toast.error('Please enter your full name.');
            return false;
        }
        if (!/^\d{10}$/.test(formData.studentId)) {
            toast.error('Student ID must be exactly 10 digits.');
            return false;
        }
        return true;
    };

    const verifyTranscript = async () => {
        if (!files.transcript) return;
        setVerifying(true);
        try {
            const text = await extractPdfText(files.transcript);
            const studentInfo = await extractStudentInfo(text);
            if (studentInfo) {
                setFormData(prev => ({
                    ...prev,
                    firstName: studentInfo.name?.split(' ')[0] || prev.firstName,
                    lastName: studentInfo.name?.split(' ').slice(1).join(' ') || prev.lastName,
                    studentId: studentInfo.studentId || prev.studentId,
                    major: studentInfo.major || prev.major,
                    gpa: studentInfo.gpa || prev.gpa
                }));
            }
            const parsedData = await parseGradesToJSON(text);
            if (parsedData && parsedData.length > 0) {
                setVerificationResult({
                    match: true,
                    message: `Verified! Found ${parsedData.length} records.`
                });
            } else {
                setVerificationResult({
                    match: false,
                    message: "Manual review required."
                });
            }
        } catch (error) {
            console.error(error);
            setVerificationResult({ match: false, message: "Verification failed." });
        } finally {
            setVerifying(false);
        }
    };

    const nextStep = async () => {
        if (step === 'type-selection') {
            if (!formData.studentType) { toast.error('Select type.'); return; }
            setStep('basic');
        } else if (step === 'basic') {
            if (validateBasicInfo()) setStep('academic');
        } else if (step === 'academic') {
            if (!formData.major || !formData.graduationDate || !files.bulletin) {
                toast.error('Fill required fields and upload bulletin.');
                return;
            }
            if (files.transcript) {
                await verifyTranscript();
                setStep('verification');
            } else {
                setStep('lifestyle');
            }
        } else if (step === 'verification') {
            setStep('lifestyle');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const result = await createStudentProfile({
                id: user.id,
                student_id: formData.studentId,
                name: `${formData.firstName} ${formData.lastName}`,
                major: formData.major,
                student_type: formData.studentType,
                housing_type: formData.housingType as any,
                meal_plan: formData.mealPlan as any,
                dorm_room_type: formData.dormRoomType as any,
                program_name: formData.major,
                expected_graduation_date: formData.graduationDate,
                gpa: formData.gpa
            });

            if (result.success) {
                toast.success('Ready to go!');
                onComplete();
            } else throw result.error;
        } catch (error: any) {
            toast.error('Setup failed.');
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = step === 'type-selection' ? 1 : step === 'basic' ? 2 : step === 'academic' ? 3 : step === 'verification' ? 4 : 5;

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden">
            {/* Grain Overlay */}
            <div className="grain opacity-[0.03]"></div>

            <Card className="w-full max-w-xl shadow-2xl border-zinc-200/60 overflow-hidden rounded-[2.5rem]">
                {/* Progress Header */}
                <div className="bg-primary px-8 py-6 flex justify-between items-center text-white relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05] pointer-events-none"></div>
                   <div className="flex items-center gap-3 relative z-10">
                      <GraduationCap className="w-6 h-6 text-secondary" />
                      <span className="font-black tracking-tight uppercase text-xs">Student Enrollment Node</span>
                   </div>
                   <div className="flex items-center gap-4 relative z-10">
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Protocol {stepIndex}/5</span>
                      <div className="flex gap-1.5">
                         {[1,2,3,4,5].map(i => (
                           <div key={i} className={`h-1.5 w-4 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-secondary' : 'bg-white/20'}`} />
                         ))}
                      </div>
                   </div>
                </div>

                <CardHeader className="pb-6 pt-8">
                    <div className="flex justify-between items-start">
                        <div>
                           <CardTitle className="text-3xl font-black font-serif tracking-tight">
                             {step === 'type-selection' ? 'Choose Journey' : 
                              step === 'basic' ? 'Personal Identity' :
                              step === 'academic' ? 'Academic Specs' :
                              step === 'verification' ? 'AI Verification' : 'Lifestyle Config'}
                           </CardTitle>
                           <CardDescription className="mt-2 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">
                              {step === 'type-selection' ? 'Initialize your institutional category.' : 'Configure your academic environment parameters.'}
                           </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors squishy-button">
                            <LogOut className="w-4 h-4 mr-2" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Abort</span>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8">
                    {step === 'type-selection' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div
                                className={`cursor-pointer border-2 rounded-[2rem] p-8 transition-all duration-500 group relative overflow-hidden ${formData.studentType === 'local' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
                                onClick={() => handleSelectChange('studentType', 'local')}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${formData.studentType === 'local' ? 'bg-primary text-white rotate-3' : 'bg-zinc-100 text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                   <Check className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-black text-zinc-900 font-serif">Regional</h4>
                                <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed">Studying within the Caribbean region.</p>
                            </div>
                            <div
                                className={`cursor-pointer border-2 rounded-[2rem] p-8 transition-all duration-500 group relative overflow-hidden ${formData.studentType === 'international' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
                                onClick={() => handleSelectChange('studentType', 'international')}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${formData.studentType === 'international' ? 'bg-primary text-white rotate-3' : 'bg-zinc-100 text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                   <Sparkles className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-black text-zinc-900 font-serif">Global</h4>
                                <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed">Studying from international territories.</p>
                            </div>
                        </div>
                    )}

                    {step === 'basic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Given Name</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Dwayne" className="rounded-2xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Surname</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Headley" className="rounded-2xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Institutional ID (10 Digits)</Label>
                                <Input id="studentId" value={formData.studentId} onChange={handleInputChange} placeholder="2021000000" maxLength={10} className="rounded-2xl" />
                            </div>
                        </div>
                    )}

                    {step === 'academic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Academic Major</Label>
                                <Input id="major" value={formData.major} onChange={handleInputChange} placeholder="BSc Computer Science" className="rounded-2xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Target Graduation</Label>
                                <Input id="graduationDate" type="month" value={formData.graduationDate} onChange={handleInputChange} className="rounded-2xl" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
                                <div className={`relative border-2 border-dashed rounded-[1.5rem] p-6 text-center transition-all ${files.bulletin ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200 hover:border-primary hover:bg-zinc-50'}`}>
                                   <input id="bulletin-upload" type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'bulletin')} />
                                   <div className="flex flex-col items-center gap-3">
                                      <Upload className={`w-8 h-8 ${files.bulletin ? 'text-emerald-500' : 'text-zinc-300'}`} />
                                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{files.bulletin ? 'Bulletin Synced' : 'Sync Bulletin'}</span>
                                      {files.bulletin && <p className="text-[10px] text-emerald-600 truncate max-w-full font-bold uppercase mt-1">{files.bulletin.name}</p>}
                                   </div>
                                </div>

                                <div className={`relative border-2 border-dashed rounded-[1.5rem] p-6 text-center transition-all ${files.transcript ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary hover:bg-zinc-50'}`}>
                                   <input id="transcript-upload" type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'transcript')} />
                                   <div className="flex flex-col items-center gap-3">
                                      <FileText className={`w-8 h-8 ${files.transcript ? 'text-primary' : 'text-zinc-300'}`} />
                                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{files.transcript ? 'Grades Synced' : 'Sync Transcript'}</span>
                                      {files.transcript && <p className="text-[10px] text-primary truncate max-w-full font-bold uppercase mt-1">{files.transcript.name}</p>}
                                   </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'verification' && (
                        <div className="text-center py-10 space-y-6 animate-in zoom-in-95">
                            {verifying ? (
                                <div className="space-y-8">
                                    <div className="relative w-24 h-24 mx-auto">
                                       <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                                       <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                                       <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-primary" />
                                    </div>
                                    <div>
                                       <h3 className="text-2xl font-black text-zinc-900 tracking-tight font-serif">AI Synthesis...</h3>
                                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2">Parsing institutional grade history</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl rotate-3 ${verificationResult?.match ? 'bg-emerald-100 text-emerald-600 shadow-emerald-900/10' : 'bg-secondary/10 text-secondary shadow-secondary/10'}`}>
                                        {verificationResult?.match ? <ShieldCheck className="h-14 w-14" /> : <AlertCircle className="h-14 w-14" />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-zinc-900 font-serif">{verificationResult?.match ? "Stream Verified" : "Analysis Warning"}</h3>
                                        <p className="text-[10px] text-zinc-500 mt-3 max-w-xs mx-auto font-black uppercase tracking-widest leading-relaxed">{verificationResult?.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'lifestyle' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-3">
                                <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Institutional Housing</Label>
                                <Select onValueChange={(val) => handleSelectChange('housingType', val)} defaultValue={formData.housingType}>
                                    <SelectTrigger className="h-14 rounded-2xl border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="dorm">On-Campus Residency</SelectItem>
                                        <SelectItem value="renting">Off-Campus Residency</SelectItem>
                                        <SelectItem value="other">Institutional Commuter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-zinc-500 uppercase tracking-widest text-[10px] ml-1">Subsistence Config</Label>
                                <Select onValueChange={(val) => handleSelectChange('mealPlan', val)} defaultValue={formData.mealPlan}>
                                    <SelectTrigger className="h-14 rounded-2xl border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">Zero-Plan Node</SelectItem>
                                        <SelectItem value="two_meal">Standard (2 Meals)</SelectItem>
                                        <SelectItem value="three_meal">Premium (3 Meals)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t border-zinc-100 pt-8 pb-8 px-8">
                    {step !== 'type-selection' && step !== 'verification' ? (
                        <Button variant="outline" onClick={() => {
                            if (step === 'basic') setStep('type-selection');
                            else if (step === 'academic') setStep('basic');
                            else if (step === 'lifestyle') setStep(files.transcript ? 'verification' : 'academic');
                        }} className="rounded-2xl border-zinc-200 font-black uppercase tracking-widest text-[10px] h-14 px-8 squishy-button">
                            Back
                        </Button>
                    ) : <div />}

                    <Button onClick={step === 'lifestyle' ? handleSubmit : nextStep} disabled={verifying || loading} className="min-w-[180px] h-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110 squishy-button">
                        {loading || verifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
                         <span className="font-black uppercase tracking-widest text-[10px]">{step === 'lifestyle' ? 'Commit to Node' : (step === 'verification' ? 'Initialize' : 'Next Protocol')}</span>}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
