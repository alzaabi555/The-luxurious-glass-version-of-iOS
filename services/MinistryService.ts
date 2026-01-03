
import { CapacitorHttp } from '@capacitor/core';
import { MinistrySession, StdsAbsDetail, StdsGradeDetail } from '../types';

// الرابط الافتراضي (يمكن تغييره من الإعدادات)
const DEFAULT_URL = 'https://mobile.moe.gov.om/Sakhr.Elasip.Portal.Mobility/Services/MTletIt.svc';

interface ServiceResponse {
    d?: any;
    [key: string]: any;
}

// User-Agent مخصص للآيفون
const HEADERS = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
};

// دالة مساعدة لجلب الرابط الحالي من التخزين
const getServiceUrl = (): string => {
    try {
        const savedUrl = localStorage.getItem('ministry_api_url');
        // إزالة الشرطة المائلة في النهاية إن وجدت
        let url = savedUrl || DEFAULT_URL;
        return url.replace(/\/+$/, '');
    } catch {
        return DEFAULT_URL;
    }
};

export const ministryService = {
    /**
     * اختبار الاتصال بالرابط (Ping)
     */
    testConnection: async (url: string): Promise<{ success: boolean; status: number; message: string }> => {
        // تنظيف الرابط
        const cleanUrl = url.replace(/\/+$/, '');
        
        try {
            console.log('📡 Testing Connection:', cleanUrl);
            
            // نحاول طلب صفحة الخدمة الرئيسية (GET)
            // عادة ما تعيد ملفات WCF صفحة HTML بوضع 200 عند طلبها بـ GET
            const response = await CapacitorHttp.get({
                url: cleanUrl,
                headers: HEADERS,
                connectTimeout: 8000,
                readTimeout: 8000
            });

            if (response.status === 200) {
                return { success: true, status: 200, message: 'الاتصال ناجح' };
            } else {
                return { success: false, status: response.status, message: `الخادم رد برمز: ${response.status}` };
            }
        } catch (error: any) {
            console.error('❌ Connection Test Failed:', error);
            return { success: false, status: 0, message: error.message || 'فشل الاتصال بالخادم' };
        }
    },

    /**
     * تسجيل الدخول
     */
    login: async (username: string, pass: string): Promise<MinistrySession | null> => {
        const baseUrl = getServiceUrl();
        const endpoint = `${baseUrl}/Login`; 
        const payload = { USme: username, PPPWZ: pass };

        try {
            console.log('📡 Attempting Login...', endpoint);
            
            const response = await CapacitorHttp.post({
                url: endpoint,
                headers: HEADERS,
                data: payload,
                connectTimeout: 15000,
                readTimeout: 15000
            });

            if (response.status === 404) {
                throw new Error(`خطأ 404: الرابط غير صحيح.\nتأكد من إعدادات الخادم.\n(${baseUrl})`);
            }

            if (response.status === 200 || response.status === 201) {
                const data = response.data as ServiceResponse;
                const result = data.d !== undefined ? data.d : data;
                
                if (typeof result === 'string' && (result.includes('Error') || result.includes('Fail'))) {
                    throw new Error('بيانات الدخول غير صحيحة أو حدث خطأ في النظام');
                }
                
                if (typeof result === 'object') {
                    if (!result.UserID && !result.id && !result.AuthToken) {
                         throw new Error('استجابة غير متوقعة من السيرفر');
                    }

                    return {
                        userId: result.UserID || result.id || '0',
                        auth: result.AuthToken || result.token || '',
                        userRoleId: result.UserRoleId || '0',
                        schoolId: result.SchoolId || '0',
                        teacherId: result.DepInsId || result.DeptInsId || '0'
                    };
                }
                return null;
            } else {
                console.error('Server Status:', response.status);
                throw new Error(`خطأ في السيرفر: ${response.status}`);
            }
        } catch (error: any) {
            console.error('❌ Login Failed:', error);
            
            let msg = error.message || 'فشل الاتصال';
            if (msg.includes('Failed to fetch') || msg.includes('Load failed')) {
                msg = 'تعذر الاتصال بالخادم. يرجى التأكد من الإنترنت.';
            }
            throw new Error(msg);
        }
    },

    /**
     * جلب الفصول (الفلتر)
     */
    getStudentAbsenceFilter: async (session: MinistrySession) => {
        const baseUrl = getServiceUrl();
        const endpoint = `${baseUrl}/GetStudentAbsenceFilter`; 
        const payload = {
            userId: session.userId,
            auth: session.auth,
            UserRoleId: session.userRoleId,
            SchoolId: session.schoolId,
            DeptInsId: session.teacherId || '' 
        };

        try {
            const response = await CapacitorHttp.post({
                url: endpoint,
                headers: HEADERS,
                data: payload,
                connectTimeout: 10000
            });
            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Status ${response.status}`);
        } catch (error) {
            console.error('Failed to get filters', error);
            throw error;
        }
    },

    /**
     * جلب تفاصيل غياب طالب
     */
    getStudentAbsenceDetails: async (
        session: MinistrySession,
        studentNo: string,
        classId: string,
        gradeId: string,
        date: Date
    ) => {
        const baseUrl = getServiceUrl();
        const endpoint = `${baseUrl}/GetStudentAbsenceDetails`; 
        const dateStr = date.toISOString().split('T')[0];

        const payload = {
            userId: session.userId,
            auth: session.auth,
            UserRoleId: session.userRoleId,
            SchoolId: session.schoolId,
            DepInsId: session.teacherId || '',
            GradeId: gradeId,
            ClassId: classId,
            StudentSchoolNo: studentNo,
            StartDate: dateStr,
            EndDate: dateStr
        };

        try {
            const response = await CapacitorHttp.post({
                url: endpoint,
                headers: HEADERS,
                data: payload
            });
            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Status ${response.status}`);
        } catch (error) {
            console.error('Failed to get absence details', error);
            throw error;
        }
    },

    /**
     * رفع (تسجيل) الغياب للوزارة
     */
    submitStudentAbsenceDetails: async (
        session: MinistrySession,
        classId: string,
        gradeId: string,
        date: Date,
        details: StdsAbsDetail[]
    ) => {
        const baseUrl = getServiceUrl();
        const endpoint = `${baseUrl}/SubmitStudentAbsenceDetails`;
        const dateStr = date.toISOString().split('T')[0];

        const payload = {
            userId: session.userId,
            auth: session.auth,
            SchoolId: session.schoolId,
            GradeId: gradeId,
            ClassId: classId,
            StartDate: dateStr,
            UserRoleId: session.userRoleId,
            StdsAbsDetails: details
        };

        console.log('📡 Submitting Absence:', payload);

        try {
            const response = await CapacitorHttp.post({
                url: endpoint,
                headers: HEADERS,
                data: payload,
                connectTimeout: 20000
            });

            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Submission Error: ${response.status}`);
        } catch (error) {
            console.error('Failed to submit absence', error);
            throw error;
        }
    },

    /**
     * رفع (تسجيل) الدرجات للوزارة
     */
    submitStudentMarksDetails: async (
        session: MinistrySession,
        config: {
            classId: string;
            gradeId: string;
            termId: string;
            subjectId: string;
            examId: string;
            eduSysId?: string; 
            stageId?: string;
            examGradeType?: number;
        },
        grades: StdsGradeDetail[]
    ) => {
        const baseUrl = getServiceUrl();
        const endpoint = `${baseUrl}/SubmitStudentMarksDetails`;

        const payload = {
            userId: session.userId,
            auth: session.auth,
            SchoolId: session.schoolId,
            UserRoleId: session.userRoleId,
            ClassId: config.classId,
            GradeId: config.gradeId,
            TermId: config.termId,
            SubjectId: config.subjectId,
            ExamId: config.examId,
            EduSysId: config.eduSysId || "1", 
            StageId: config.stageId || "0", 
            ExamGradeType: config.examGradeType || 1, 
            StdsGradeDetails: grades
        };

        console.log('📡 Submitting Marks:', payload);

        try {
            const response = await CapacitorHttp.post({
                url: endpoint,
                headers: HEADERS,
                data: payload,
                connectTimeout: 20000
            });

            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Marks Submission Error: ${response.status}`);
        } catch (error) {
            console.error('Failed to submit marks', error);
            throw error;
        }
    }
};
