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
        <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-6">
            <Card className="w-full max-w-xl shadow-2xl border-slate-200/60 overflow-hidden">
                {/* Progress Header */}
                <div className="bg-slate-900 px-8 py-4 flex justify-between items-center text-white">
                   <div className="flex items-center gap-3">
                      <GraduationCap className="w-6 h-6 text-blue-400" />
                      <span className="font-bold tracking-tight">Setup Profile</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Step {stepIndex} of 5</span>
                      <div className="flex gap-1">
                         {[1,2,3,4,5].map(i => (
                           <div key={i} className={`h-1.5 w-4 rounded-full ${i <= stepIndex ? 'bg-blue-500' : 'bg-slate-700'}`} />
                         ))}
                      </div>
                   </div>
                </div>

                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                           <CardTitle className="text-2xl">
                             {step === 'type-selection' ? 'Choose Your Journey' : 
                              step === 'basic' ? 'Personal Info' :
                              step === 'academic' ? 'Academic Details' :
                              step === 'verification' ? 'AI Verification' : 'Student Lifestyle'}
                           </CardTitle>
                           <CardDescription className="mt-1">
                              {step === 'type-selection' ? 'Select your enrollment category to customize your experience.' : 'Help us personalize your degree planner.'}
                           </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {step === 'type-selection' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 group ${formData.studentType === 'local' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                                onClick={() => handleSelectChange('studentType', 'local')}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.studentType === 'local' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600'}`}>
                                   <Check className="w-6 h-6" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">Local</h4>
                                <p className="text-sm text-slate-500 mt-1">Studying in Trinidad & Tobago.</p>
                            </div>
                            <div
                                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 group ${formData.studentType === 'international' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                                onClick={() => handleSelectChange('studentType', 'international')}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.studentType === 'international' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600'}`}>
                                   <Sparkles className="w-6 h-6" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">International</h4>
                                <p className="text-sm text-slate-500 mt-1">Studying from abroad.</p>
                            </div>
                        </div>
                    )}

                    {step === 'basic' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700 ml-1">First Name</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Dwayne" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700 ml-1">Last Name</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Headley" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 ml-1">Student ID (10 Digits)</Label>
                                <Input id="studentId" value={formData.studentId} onChange={handleInputChange} placeholder="2021000000" maxLength={10} />
                            </div>
                        </div>
                    )}

                    {step === 'academic' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 ml-1">Degree Program</Label>
                                <Input id="major" value={formData.major} onChange={handleInputChange} placeholder="BSc Computer Science" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 ml-1">Exp. Graduation</Label>
                                <Input id="graduationDate" type="month" value={formData.graduationDate} onChange={handleInputChange} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${files.bulletin ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
                                   <input id="bulletin-upload" type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'bulletin')} />
                                   <div className="flex flex-col items-center gap-2">
                                      <Upload className={`w-8 h-8 ${files.bulletin ? 'text-emerald-500' : 'text-slate-300'}`} />
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{files.bulletin ? 'Bulletin Uploaded' : 'Upload Bulletin'}</span>
                                      {files.bulletin && <p className="text-[10px] text-emerald-600 truncate max-w-full font-medium">{files.bulletin.name}</p>}
                                   </div>
                                </div>

                                <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${files.transcript ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
                                   <input id="transcript-upload" type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'transcript')} />
                                   <div className="flex flex-col items-center gap-2">
                                      <FileText className={`w-8 h-8 ${files.transcript ? 'text-blue-500' : 'text-slate-300'}`} />
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{files.transcript ? 'Transcript Uploaded' : 'Upload Transcript'}</span>
                                      {files.transcript && <p className="text-[10px] text-blue-600 truncate max-w-full font-medium">{files.transcript.name}</p>}
                                   </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'verification' && (
                        <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
                            {verifying ? (
                                <div className="space-y-6">
                                    <div className="relative w-20 h-20 mx-auto">
                                       <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                       <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                       <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
                                    </div>
                                    <div>
                                       <h3 className="text-xl font-bold text-slate-900 tracking-tight">AI Analysis in Progress</h3>
                                       <p className="text-sm text-slate-500 mt-1 font-medium">Scanning transcript for GPA and course history...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg ${verificationResult?.match ? 'bg-emerald-100 text-emerald-600 shadow-emerald-900/10' : 'bg-amber-100 text-amber-600 shadow-amber-900/10'}`}>
                                        {verificationResult?.match ? <ShieldCheck className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{verificationResult?.match ? "Data Verified Successfully" : "Review Required"}</h3>
                                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto font-medium">{verificationResult?.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'lifestyle' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 ml-1">Housing</Label>
                                <Select onValueChange={(val) => handleSelectChange('housingType', val)} defaultValue={formData.housingType}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dorm">On-Campus Dorm</SelectItem>
                                        <SelectItem value="renting">Off-Campus Renting</SelectItem>
                                        <SelectItem value="other">Commuter / Home</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 ml-1">Meal Plan</Label>
                                <Select onValueChange={(val) => handleSelectChange('mealPlan', val)} defaultValue={formData.mealPlan}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="two_meal">2 Meals/Day</SelectItem>
                                        <SelectItem value="three_meal">3 Meals/Day</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t border-slate-100 pt-6">
                    {step !== 'type-selection' && step !== 'verification' ? (
                        <Button variant="outline" onClick={() => {
                            if (step === 'basic') setStep('type-selection');
                            else if (step === 'academic') setStep('basic');
                            else if (step === 'lifestyle') setStep(files.transcript ? 'verification' : 'academic');
                        }}>
                            Back
                        </Button>
                    ) : <div />}

                    <Button onClick={step === 'lifestyle' ? handleSubmit : nextStep} disabled={verifying || loading} className="min-w-[140px]">
                        {loading || verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                         (step === 'lifestyle' ? 'Launch Dashboard' : (step === 'verification' ? 'Continue' : 'Next Step'))}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
