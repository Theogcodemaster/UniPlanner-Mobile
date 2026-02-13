import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Domain validation
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
                toast.success('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Successfully logged in!');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred during authentication');
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
            toast.error(error.message || 'Error logging in with Google');
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error('Please enter your email address first.');
            return;
        }
        try {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // or a specific update-password page
            });
            if (error) throw error;
            toast.success('Password reset email sent!');
        } catch (error: any) {
            toast.error(error.message || 'Error sending reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-gray-100">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-[#003366]">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? 'Enter your email below to create your account'
                            : 'Enter your email below to login to your account'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-xs text-[#003366] hover:underline"
                                        disabled={loading}
                                    >
                                        Forgot password?
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
                            />
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" disabled={loading} onClick={handleGoogleLogin} className="w-full">
                            {/* Google Icon SVG */}
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google
                        </Button>

                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-6">
                        <Button className="w-full bg-[#003366] hover:bg-[#00254d]" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <button
                                type="button"
                                className="underline text-[#003366] hover:text-[#00254d]"
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? 'Sign in' : 'Sign up'}
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
