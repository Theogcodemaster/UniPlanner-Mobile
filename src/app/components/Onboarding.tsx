import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Check, Upload, FileText, LogOut, AlertCircle, ShieldCheck } from 'lucide-react';
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
        // Force reload to clear state and redirect to login
        window.location.reload();
    };

    const validateBasicInfo = () => {
        if (!formData.firstName || !formData.lastName) {
            toast.error('Please enter your full name.');
            return false;
        }
        // 10-digit number validation
        if (!/^\d{10}$/.test(formData.studentId)) {
            toast.error('Student ID must be exactly 10 digits (numbers only).');
            return false;
        }
        return true;
    };

    const verifyTranscript = async () => {
        if (!files.transcript) return;

        setVerifying(true);
        try {
            const text = await extractPdfText(files.transcript);

            // 1. Extract Student Info
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
                if (studentInfo.gpa) {
                    toast.success(`Extracted GPA: ${studentInfo.gpa}`);
                }
            }

            const parsedData = await parseGradesToJSON(text);

            // Simple verification logic: Check if transcript has any data
            // In a real scenario, we'd check against formData.major if the transcripts contain major info

            if (parsedData && parsedData.length > 0) {
                setVerificationResult({
                    match: true,
                    message: `Transcript verified. Found ${parsedData.length} courses.`
                });
            } else {
                setVerificationResult({
                    match: false,
                    message: "We couldn't extract clear course data. Please ensure it's a valid transcript."
                });
            }
        } catch (error) {
            console.error(error);
            setVerificationResult({
                match: false,
                message: "Error analyzing transcript. Proceed with caution."
            });
        } finally {
            setVerifying(false);
        }
    };

    const nextStep = async () => {
        if (step === 'type-selection') {
            if (!formData.studentType) {
                toast.error('Please select your student type.');
                return;
            }
            setStep('basic');
        } else if (step === 'basic') {
            if (validateBasicInfo()) {
                setStep('academic');
            }
        } else if (step === 'academic') {
            if (!formData.major || !formData.graduationDate) {
                toast.error('Please fill in all academic fields.');
                return;
            }
            if (!files.bulletin) {
                toast.error('Please upload your Programme Bulletin.');
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
            if (!user) throw new Error('No user found');

            const profileData = {
                id: user.id,
                student_id: formData.studentId,
                name: `${formData.firstName} ${formData.lastName}`,
                major: formData.major,
                student_type: formData.studentType as 'international' | 'local',
                housing_type: formData.housingType as any,
                meal_plan: formData.mealPlan as any,
                dorm_room_type: formData.dormRoomType as any,
                program_name: formData.major,
                expected_graduation_date: formData.graduationDate,
                gpa: formData.gpa
            };

            const result = await createStudentProfile(profileData);

            if (result.success) {
                toast.success('Profile created successfully!');
                // Note: File uploads to Supabase Storage would happen here in a real app
                onComplete();
            } else {
                throw result.error;
            }
        } catch (error: any) {
            console.error('Onboarding error:', error);
            toast.error(`Failed to create profile: ${error?.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Student Onboarding</CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit
                        </Button>
                    </div>
                    <CardDescription>
                        Step {step === 'type-selection' ? 1 : step === 'basic' ? 2 : step === 'academic' ? 3 : step === 'verification' ? 4 : 5} of 5
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 'type-selection' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className={`cursor-pointer border-2 rounded-lg p-4 text-center hover:border-[#003366] transition-colors ${formData.studentType === 'local' ? 'border-[#003366] bg-blue-50' : 'border-gray-200'}`}
                                onClick={() => handleSelectChange('studentType', 'local')}
                            >
                                <div className="text-xl font-semibold mb-2">Local Student</div>
                                <p className="text-sm text-gray-500">I'm a local student studying in Trinidad & Tobago.</p>
                            </div>
                            <div
                                className={`cursor-pointer border-2 rounded-lg p-4 text-center hover:border-[#003366] transition-colors ${formData.studentType === 'international' ? 'border-[#003366] bg-blue-50' : 'border-gray-200'}`}
                                onClick={() => handleSelectChange('studentType', 'international')}
                            >
                                <div className="text-xl font-semibold mb-2">International Student</div>
                                <p className="text-sm text-gray-500">I'm an international student studying abroad.</p>
                            </div>
                        </div>
                    )}

                    {step === 'basic' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Dwayne" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Headley" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="studentId">Student ID (10 Entires - Digits only)</Label>
                                <Input
                                    id="studentId"
                                    value={formData.studentId}
                                    onChange={handleInputChange}
                                    placeholder="0000000000"
                                    maxLength={10}
                                />
                                <p className="text-xs text-muted-foreground">Must be exactly 10 numbers.</p>
                            </div>
                        </>
                    )}

                    {step === 'academic' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="major">Major / Program</Label>
                                <Input id="major" value={formData.major} onChange={handleInputChange} placeholder="Computer Science" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="graduationDate">Expected Graduation Date</Label>
                                <Input id="graduationDate" type="month" value={formData.graduationDate} onChange={handleInputChange} />
                            </div>

                            <div className="pt-4 border-t">
                                <Label className="mb-2 block">Upload Documents</Label>

                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-gray-400" />
                                            <Label htmlFor="bulletin-upload" className="cursor-pointer text-[#003366]">
                                                {files.bulletin ? files.bulletin.name : "Upload Programme Bulletin (PDF)"}
                                            </Label>
                                            <Input id="bulletin-upload" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'bulletin')} />
                                        </div>
                                    </div>

                                    {(
                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                                <Label htmlFor="transcript-upload" className="cursor-pointer text-[#003366]">
                                                    {files.transcript ? files.transcript.name : "Upload Transcript (PDF)"}
                                                </Label>
                                                <Input id="transcript-upload" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'transcript')} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 'verification' && (
                        <div className="text-center space-y-4 py-4">
                            {verifying ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-[#003366] mb-4" />
                                    <h3 className="text-xl font-semibold">Verifying Transcript...</h3>
                                    <p className="text-muted-foreground">Our AI is analyzing your academic records.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    {verificationResult?.match ? (
                                        <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
                                    ) : (
                                        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
                                    )}
                                    <h3 className="text-xl font-semibold mb-2">
                                        {verificationResult?.match ? "Verification Successful" : "Verification Note"}
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-xs mx-auto">
                                        {verificationResult?.message}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        You can proceed to the next step.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'lifestyle' && (
                        <>
                            <div className="space-y-2">
                                <Label>Housing Type</Label>
                                <Select onValueChange={(val) => handleSelectChange('housingType', val)} defaultValue={formData.housingType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select housing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dorm">On-Campus Dorm</SelectItem>
                                        <SelectItem value="renting">Off-Campus Renting</SelectItem>
                                        <SelectItem value="other">Commuter / Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.housingType === 'dorm' && (
                                <div className="space-y-2">
                                    <Label>Dorm Room Type</Label>
                                    <Select onValueChange={(val) => handleSelectChange('dormRoomType', val)} defaultValue={formData.dormRoomType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select room type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single</SelectItem>
                                            <SelectItem value="double">Double</SelectItem>
                                            <SelectItem value="triple">Triple</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Meal Plan</Label>
                                <Select onValueChange={(val) => handleSelectChange('mealPlan', val)} defaultValue={formData.mealPlan}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select meal plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Meal Plan</SelectItem>
                                        <SelectItem value="two_meal">2 Meals/Day</SelectItem>
                                        <SelectItem value="three_meal">3 Meals/Day</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step !== 'type-selection' && step !== 'verification' && (
                        <Button variant="outline" onClick={() => {
                            if (step === 'basic') setStep('type-selection');
                            else if (step === 'academic') setStep('basic');
                            else if (step === 'lifestyle') setStep(files.transcript ? 'verification' : 'academic');
                        }}>
                            Back
                        </Button>
                    )}

                    {/* Placeholder for alignment if Back button is hidden */}
                    {(step === 'type-selection' || step === 'verification') && <div></div>}

                    <div className="flex-1 flex justify-end">
                        {step === 'lifestyle' ? (
                            <Button onClick={handleSubmit} disabled={loading} className="bg-[#003366] hover:bg-[#00254d]">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Setup <Check className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={nextStep} disabled={verifying} className="bg-[#003366] hover:bg-[#00254d]">
                                {step === 'verification' ? 'Continue' : 'Next'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
