import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Loader2, GraduationCap } from 'lucide-react';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.endsWith('@stu.usc.edu.tt')) {
            toast.error('Only @stu.usc.edu.tt emails are allowed.');
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Check your email for confirmation!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Successfully logged in!');
            }
        } catch (error: any) {
            toast.error(error.message || 'Authentication error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        hd: 'stu.usc.edu.tt',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message || 'Google login error');
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error('Enter email to reset password.');
            return;
        }
        try {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            toast.success('Reset email sent!');
        } catch (error: any) {
            toast.error(error.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
            {/* Grain Overlay */}
            <div className="grain opacity-[0.03]"></div>

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-zinc-200/60 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4">
                <CardHeader className="space-y-6 text-center pb-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/20 rotate-3">
                        <GraduationCap className="h-12 w-12 text-white -rotate-3" />
                    </div>
                    <div>
                        <CardTitle className="text-4xl font-black tracking-tight text-zinc-900 font-serif">
                            {isSignUp ? 'Enrollment' : 'Portal Login'}
                        </CardTitle>
                        <CardDescription className="mt-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">
                            Institutional Access Required
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-zinc-500 font-black uppercase tracking-widest text-[10px] ml-1">Student Credentials</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@stu.usc.edu.tt"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="rounded-2xl border-zinc-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" title="Password" className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Encryption Key</Label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[10px] font-black text-primary hover:text-secondary transition-colors uppercase tracking-widest"
                                        disabled={loading}
                                    >
                                        Recovery
                                    </button>
                                )}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="rounded-2xl border-zinc-200"
                            />
                        </div>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-100" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">
                                <span className="bg-white px-4">Verification Layer</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" disabled={loading} onClick={handleGoogleLogin} className="w-full gap-3 h-14 rounded-2xl border-zinc-200 hover:bg-zinc-50 squishy-button">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="font-bold text-zinc-600">Google Workspace</span>
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 pt-6">
                        <Button className="w-full h-14 text-base rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110 squishy-button" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUp ? 'Create Node' : 'Initialize Session')}
                        </Button>
                        <div className="text-xs text-center font-bold uppercase tracking-widest text-zinc-400">
                            {isSignUp ? 'Established User? ' : "Incomplete Profile? "}
                            <button
                                type="button"
                                className="text-primary hover:text-secondary transition-colors"
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? 'Authorize' : 'Register'}
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
