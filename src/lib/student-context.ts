import { supabase } from './supabase';

export interface ComprehensiveStudentProfile {
    id: string; // user_id
    student_id: string;
    name: string;
    major: string;
    minor?: string;
    student_type?: 'international' | 'local';
    housing_type: 'dorm' | 'renting' | 'other';
    meal_plan: 'none' | 'two_meal' | 'three_meal' | null;
    dorm_room_type?: 'single' | 'double' | 'triple' | null;
    program_name: string;
    gpa: number;
    expected_graduation_date: string;
    enrollment_date?: string;
    // UI specific fields (mocked or derived)
    completedCredits: number;
    totalCredits: number;
    advisorName: string;
    currentSemester: string;
}

export async function fetchStudentProfile(studentId: string): Promise<ComprehensiveStudentProfile | null> {
    try {
        // Determine user_id from student_id first (or query directly if we assume login context)
        // Based on schema: users(student_id) -> student_profiles(user_id) -> programs(program_id)

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
        user_id,
        first_name,
        last_name,
        student_id,
        student_profiles (
          student_type,
          housing_type,
          meal_plan,
          dorm_room_type,
          expected_graduation_date,
          gpa,
          minor,
          programs (
            program_name,
            degree_type
          )
        )
      `)
            .eq('student_id', studentId)
            .single();

        if (userError || !userData) {
            console.error('Error fetching user:', userError);
            return null;
        }

        const profile = Array.isArray(userData.student_profiles) ? userData.student_profiles[0] : userData.student_profiles;
        const programData = profile?.programs;
        // Handle Supabase returning array or object for single relation
        const program = Array.isArray(programData) ? programData[0] : programData;

        // Try to fetch GPA from academic status view (may not exist)
        let gpaValue = profile?.gpa || 0.0;
        try {
            const { data: statusData } = await supabase
                .from('student_academic_status')
                .select('cumulative_gpa')
                .eq('student_id', studentId)
                .maybeSingle();
            if (statusData?.cumulative_gpa) {
                gpaValue = statusData.cumulative_gpa;
            }
        } catch (e) {
            console.warn('student_academic_status not available, using profile GPA');
        }


        return {
            id: userData.user_id,
            student_id: userData.student_id,
            name: `${userData.first_name} ${userData.last_name}`,
            major: program?.program_name || 'Undeclared',
            minor: profile?.minor || 'None',
            student_type: profile?.student_type || 'local',
            housing_type: profile?.housing_type || 'other',
            meal_plan: profile?.meal_plan || 'none',
            dorm_room_type: profile?.dorm_room_type,
            program_name: program?.program_name || '',
            gpa: gpaValue,
            expected_graduation_date: profile?.expected_graduation_date || '',
            completedCredits: 45,
            totalCredits: 120,
            advisorName: 'Dr. Smith',
            currentSemester: 'Spring 2024'
        };

    } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        return null;
    }
}

export async function fetchUserProfile(userId: string): Promise<ComprehensiveStudentProfile | null> {
    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
        user_id,
        first_name,
        last_name,
        student_id,
        student_profiles (
          student_type,
          housing_type,
          meal_plan,
          dorm_room_type,
          expected_graduation_date,
          gpa,
          minor,
          programs (
            program_name,
            degree_type
          )
        )
      `)
            .eq('user_id', userId)
            .single();

        if (userError || !userData) {
            return null;
        }

        const profile = Array.isArray(userData.student_profiles) ? userData.student_profiles[0] : userData.student_profiles;
        const programData = profile?.programs;
        const program = Array.isArray(programData) ? programData[0] : programData;

        console.log('fetchUserProfile - raw student_profiles:', userData.student_profiles);
        console.log('fetchUserProfile - profile:', profile);
        console.log('fetchUserProfile - programData:', programData);
        console.log('fetchUserProfile - resolved program:', program);

        // Try to fetch GPA from academic status view (may not exist)
        let gpaValue = profile?.gpa || 0.0;
        try {
            const { data: statusData } = await supabase
                .from('student_academic_status')
                .select('cumulative_gpa')
                .eq('student_id', userData.student_id)
                .maybeSingle();
            if (statusData?.cumulative_gpa) {
                gpaValue = statusData.cumulative_gpa;
            }
        } catch (e) {
            console.warn('student_academic_status not available, using profile GPA');
        }

        return {
            id: userData.user_id,
            student_id: userData.student_id,
            name: `${userData.first_name} ${userData.last_name}`,
            major: program?.program_name || 'Undeclared',
            minor: profile?.minor || 'None',
            student_type: profile?.student_type || 'local',
            housing_type: profile?.housing_type || 'other',
            meal_plan: profile?.meal_plan || 'none',
            dorm_room_type: profile?.dorm_room_type,
            program_name: program?.program_name || '',
            gpa: gpaValue,
            expected_graduation_date: profile?.expected_graduation_date || '',
            completedCredits: 45,
            totalCredits: 120,
            advisorName: 'Dr. Smith',
            currentSemester: 'Spring 2024'
        };

    } catch (error) {
        console.error('Unexpected error fetching profile via user_id:', error);
        return null;
    }
}

export async function createStudentProfile(profile: Omit<ComprehensiveStudentProfile, 'id' | 'completedCredits' | 'totalCredits' | 'advisorName' | 'currentSemester'> & { id: string }) {
    try {
        // 1. Update/Insert into public.users
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                user_id: profile.id,
                student_id: profile.student_id,
                first_name: profile.name.split(' ')[0], // Simple split for now
                last_name: profile.name.split(' ').slice(1).join(' '),
                email: (await supabase.auth.getUser()).data.user?.email
            });

        if (userError) throw userError;

        // 2. Handle Program FIRST so we can include program_id in the profile upsert
        let programId: string | null = null;

        if (profile.program_name) {
            // Check if program already exists (use maybeSingle to avoid error when not found)
            const { data: existingProgram } = await supabase
                .from('programs')
                .select('program_id')
                .eq('program_name', profile.program_name)
                .maybeSingle();

            if (existingProgram?.program_id) {
                programId = existingProgram.program_id;
                console.log('Found existing program:', programId);
            } else {
                // Create the program (generate program_code from name, e.g. "Computer Science" -> "COMP_SCI")
                const programCode = profile.program_name
                    .toUpperCase()
                    .split(' ')
                    .map((w: string) => w.substring(0, 4))
                    .join('_');

                const { data: newProgram, error: programInsertError } = await supabase
                    .from('programs')
                    .insert({
                        program_name: profile.program_name,
                        program_code: programCode,
                        degree_type: 'Bachelor',
                        department: 'General Studies', // Default - schema out of sync
                        total_credits_required: 120 // Default bachelor's degree requirement
                    })
                    .select('program_id')
                    .single();

                if (programInsertError) {
                    console.error('Error creating program:', programInsertError);
                } else {
                    programId = newProgram.program_id;
                    console.log('Created new program:', programId);
                }
            }
        }

        // 3. Insert or Update student_profiles
        // (No UNIQUE constraint on user_id, so we can't use upsert — check first then insert/update)
        const profilePayload: Record<string, any> = {
            student_type: profile.student_type || 'local',
            housing_type: profile.housing_type,
            meal_plan: profile.housing_type === 'dorm' ? (profile.meal_plan || 'three_meal') : null,
            dorm_room_type: profile.housing_type === 'dorm' ? (profile.dorm_room_type || 'double') : null,
            expected_graduation_date: profile.expected_graduation_date
                ? (profile.expected_graduation_date.length === 7
                    ? `${profile.expected_graduation_date}-01`
                    : profile.expected_graduation_date)
                : null,
            enrollment_date: profile.enrollment_date || new Date().toISOString().split('T')[0],
            gpa: profile.gpa,
            minor: profile.minor || 'None'
        };

        if (programId) {
            profilePayload.program_id = programId;
        }

        // Check if profile already exists for this user
        const { data: existingProfile } = await supabase
            .from('student_profiles')
            .select('profile_id')
            .eq('user_id', profile.id)
            .maybeSingle();

        let profileError;

        if (existingProfile) {
            // UPDATE existing profile
            console.log('Updating existing student_profiles with:', profilePayload);
            const result = await supabase
                .from('student_profiles')
                .update(profilePayload)
                .eq('user_id', profile.id);
            profileError = result.error;
        } else {
            // INSERT new profile (include user_id)
            profilePayload.user_id = profile.id;
            console.log('Inserting new student_profiles with:', profilePayload);
            const result = await supabase
                .from('student_profiles')
                .insert(profilePayload);
            profileError = result.error;
        }

        if (profileError) throw profileError;

        return { success: true };

    } catch (error) {
        console.error('Error creating profile:', error);
        return { success: false, error };
    }
}
