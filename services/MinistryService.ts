
import { CapacitorHttp } from '@capacitor/core';
import { MinistrySession, StdsAbsDetail, StdsGradeDetail } from '../types';

// الرابط الافتراضي (خدمات الهاتف الأساسية - الأفضل للمعلمين)
const DEFAULT_URL = 'https://mobile.moe.gov.om/Sakhr.Elasip.Portal.Mobility/Services/MTletIt.svc';

// احتمالات أسماء دوال تسجيل الدخول
const POSSIBLE_LOGIN_ENDPOINTS = [
    '/Login',           // (MTletIt) الأكثر شيوعاً للمعلمين - الأولوية الأولى
    '/UserLogin',       // (PortalMobility) شائع أيضاً
    '/SignIn',
    '/Authenticate',
    '/ValidateUser',    // (ParentApp) تم نقلها للأسفل كخيار أخير
    '/GetUserData'
];

interface ServiceResponse {
    d?: any;
    [key: string]: any;
}

// User-Agent مخصص ليظهر الطلب وكأنه من هاتف آيفون حقيقي
const HEADERS = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
};

const getServiceUrl = (): string => {
    try {
        const savedUrl = localStorage.getItem('ministry_api_url');
        let url = savedUrl || DEFAULT_URL;
        return url.replace(/\/+$/, '');
    } catch {
        return DEFAULT_URL;
    }
};

export const ministryService = {
    /**
     * فحص ذكي: يحاول عدة مسارات للعثور على المسار الصحيح (Deep Ping)
     */
    testConnection: async (url: string): Promise<{ success: boolean; status: number; message: string; foundEndpoint?: string }> => {
        const cleanUrl = url.replace(/\/+$/, '');
        
        console.log('📡 Starting Deep Probe on:', cleanUrl);

        // نجرب كل الاحتمالات
        for (const path of POSSIBLE_LOGIN_ENDPOINTS) {
            const endpoint = `${cleanUrl}${path}`;
            try {
                // نرسل طلب وهمي سريع
                const response = await CapacitorHttp.post({
                    url: endpoint,
                    headers: HEADERS,
                    data: { USme: "ping", PPPWZ: "ping" },
                    connectTimeout: 5000,
                    readTimeout: 5000
                });

                // 404 = الدالة غير موجودة في هذا السيرفر، جرب التالية
                if (response.status === 404) continue;

                // 200 أو 500 أو 401 = السيرفر موجود ورد علينا (حتى لو بخطأ في البيانات)
                // وهذا يعني أن الرابط والمسار صحيحان
                if (response.status === 200 || response.status === 500 || response.status === 401) {
                    return { 
                        success: true, 
                        status: response.status, 
                        message: `تم العثور على الخدمة في ${path} ✅`,
                        foundEndpoint: path
                    };
                }
            } catch (e) {
                console.warn(`Probe failed for ${path}`, e);
            }
        }

        return { success: false, status: 404, message: 'لم يتم العثور على نقطة دخول صالحة (404) في هذا السيرفر.' };
    },

    /**
     * تسجيل الدخول مع الاستكشاف التلقائي
     */
    login: async (username: string, pass: string): Promise<MinistrySession | null> => {
        const baseUrl = getServiceUrl();
        const payload = { USme: username, PPPWZ: pass };
        
        let lastError = null;

        // نحاول استخدام المسار المحفوظ سابقاً لسرعة الاتصال
        const cachedPath = localStorage.getItem('ministry_login_path');
        let pathsToTry = POSSIBLE_LOGIN_ENDPOINTS;
        
        if (cachedPath) {
            // نضع المسار المحفوظ في بداية القائمة
            pathsToTry = [cachedPath, ...POSSIBLE_LOGIN_ENDPOINTS.filter(p => p !== cachedPath)];
        }

        // Loop through possible endpoints
        for (const path of pathsToTry) {
            const endpoint = `${baseUrl}${path}`;
            console.log(`📡 Trying endpoint: ${endpoint}`);

            try {
                const response = await CapacitorHttp.post({
                    url: endpoint,
                    headers: HEADERS,
                    data: payload,
                    connectTimeout: 8000, // مهلة قصيرة للتجربة السريعة
                    readTimeout: 8000
                });

                // إذا 404، يعني هذا المسار خطأ، جرب غيره
                if (response.status === 404) continue;

                // إذا وصلنا هنا، السيرفر رد بشيء غير 404
                if (response.status === 200 || response.status === 201) {
                    const data = response.data as ServiceResponse;
                    // قد تكون الاستجابة مباشرة أو مغلفة بـ d
                    const result = data.d !== undefined ? data.d : data;
                    
                    // تحقق من رسائل الخطأ النصية من السيرفر
                    if (typeof result === 'string') {
                         if (result.toLowerCase().includes('error') || result.toLowerCase().includes('fail')) {
                             throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
                         }
                    }
                    
                    if (typeof result === 'object') {
                        // التحقق من نجاح الدخول بوجود معرف المستخدم أو التوكن
                        if (!result.UserID && !result.id && !result.AuthToken && !result.token) {
                             // قد تكون استجابة 200 لكن الدخول فشل (منطق السيرفر)
                             throw new Error('بيانات الدخول غير صحيحة');
                        }

                        // نجحنا! نحفظ المسار الصحيح لاستخدامه لاحقاً (تحسين الأداء مستقبلاً)
                        localStorage.setItem('ministry_login_path', path);

                        return {
                            userId: result.UserID || result.id || '0',
                            auth: result.AuthToken || result.token || '',
                            userRoleId: result.UserRoleId || '0',
                            schoolId: result.SchoolId || '0',
                            teacherId: result.DepInsId || result.DeptInsId || '0'
                        };
                    }
                } else {
                    throw new Error(`خطأ في السيرفر: ${response.status}`);
                }
            } catch (error: any) {
                lastError = error;
                // إذا كان الخطأ "فشل اتصال" (Network Error)، نتوقف ولا نكمل الدوران لأن النت مقطوع غالباً
                if (error.message && (error.message.includes('Network') || error.message.includes('Failed to fetch'))) {
                    throw error;
                }
                // أخطاء أخرى (مثل 500 أو كلمة مرور خطأ) نعتبرها فشل في هذا المسار ونكمل أو نرمي الخطأ
                if (error.message === 'اسم المستخدم أو كلمة المرور غير صحيحة') {
                    throw error;
                }
            }
        }

        // إذا انتهت الحلقة ولم ننجح
        if (lastError) throw lastError;
        throw new Error('لم يتم العثور على خدمة الدخول في هذا الرابط. تأكد من صحة الرابط في الإعدادات.');
    },

    /**
     * جلب الفصول
     */
    getStudentAbsenceFilter: async (session: MinistrySession) => {
        const baseUrl = getServiceUrl();
        // محاولة مسارات شائعة للفلتر أيضاً
        const endpoints = ['/GetStudentAbsenceFilter', '/GetClasses', '/TeacherClasses', '/GetTeacherClasses'];
        
        for (const path of endpoints) {
            try {
                const response = await CapacitorHttp.post({
                    url: `${baseUrl}${path}`,
                    headers: HEADERS,
                    data: {
                        userId: session.userId,
                        auth: session.auth,
                        UserRoleId: session.userRoleId,
                        SchoolId: session.schoolId,
                        DeptInsId: session.teacherId || '' 
                    },
                    connectTimeout: 10000
                });

                if (response.status === 200) {
                    const data = response.data as ServiceResponse;
                    return data.d !== undefined ? data.d : data;
                }
            } catch (e) { continue; }
        }
        throw new Error('فشل جلب الفصول (404)');
    },

    getStudentAbsenceDetails: async (session: MinistrySession, studentNo: string, classId: string, gradeId: string, date: Date) => {
        const baseUrl = getServiceUrl();
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
                url: `${baseUrl}/GetStudentAbsenceDetails`,
                headers: HEADERS,
                data: payload
            });
            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Status ${response.status}`);
        } catch (error) {
            console.error('Failed details', error);
            throw error;
        }
    },

    submitStudentAbsenceDetails: async (session: MinistrySession, classId: string, gradeId: string, date: Date, details: StdsAbsDetail[]) => {
        const baseUrl = getServiceUrl();
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

        try {
            const response = await CapacitorHttp.post({
                url: `${baseUrl}/SubmitStudentAbsenceDetails`,
                headers: HEADERS,
                data: payload,
                connectTimeout: 20000
            });

            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Error: ${response.status}`);
        } catch (error) {
            throw error;
        }
    },

    submitStudentMarksDetails: async (session: MinistrySession, config: any, grades: StdsGradeDetail[]) => {
        const baseUrl = getServiceUrl();
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

        try {
            const response = await CapacitorHttp.post({
                url: `${baseUrl}/SubmitStudentMarksDetails`,
                headers: HEADERS,
                data: payload,
                connectTimeout: 20000
            });

            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Error: ${response.status}`);
        } catch (error) {
            throw error;
        }
    }
};
