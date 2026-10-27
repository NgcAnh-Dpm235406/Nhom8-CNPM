import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import type {
  AdminCommitteeRecord,
  AdmissionProfile,
  DefenseCandidate,
  DefenseEvaluationInput,
  Lecturer,
  LecturerInput
} from '../../types';

export type ReviewStatus = 'Đạt yêu cầu' | 'Cần bổ sung' | 'Không đạt';
type CommitteeRole = 'presidentId' | 'reviewer1Id' | 'reviewer2Id' | 'secretaryId' | 'memberId';
type EvaluationRole = 'president' | 'reviewer1' | 'reviewer2' | 'secretary' | 'member';
type ScoreDraft = { contentScore: string; presentationScore: string; qaScore: string; feedback: string };

const evaluationRoles: {
  key: EvaluationRole;
  label: string;
  lecturerId: (committee: AdminCommitteeRecord) => number;
  lecturerName: (committee: AdminCommitteeRecord) => string;
}[] = [
  { key: 'president', label: 'Chủ tịch', lecturerId: committee => committee.president_id, lecturerName: committee => committee.president_name },
  { key: 'reviewer1', label: 'Phản biện 1', lecturerId: committee => committee.reviewer_1_id, lecturerName: committee => committee.reviewer1_name },
  { key: 'reviewer2', label: 'Phản biện 2', lecturerId: committee => committee.reviewer_2_id, lecturerName: committee => committee.reviewer2_name },
  { key: 'secretary', label: 'Thư ký', lecturerId: committee => committee.secretary_id, lecturerName: committee => committee.secretary_name },
  { key: 'member', label: 'Ủy viên', lecturerId: committee => committee.member_id, lecturerName: committee => committee.member_name }
];

const emptyScoreDraft = (): ScoreDraft => ({
  contentScore: '',
  presentationScore: '',
  qaScore: '',
  feedback: ''
});

const resolveEvaluationLecturerId = (
  role: (typeof evaluationRoles)[number],
  committee: AdminCommitteeRecord,
  lecturers: Lecturer[]
): number | null => {
  const configuredId = role.lecturerId(committee);
  if (Number.isSafeInteger(configuredId) && configuredId > 0) return configuredId;

  const matches = lecturers.filter(
    lecturer => lecturer.full_name.trim().toLocaleLowerCase() === role.lecturerName(committee).trim().toLocaleLowerCase()
  );
  return matches.length === 1 ? matches[0].lecturer_id : null;
};

const emptyLecturerForm: LecturerInput = {
  username: '',
  lecturerCode: '',
  fullName: '',
  degree: 'Tiến sĩ',
  email: '',
  phone: '',
  maxSlots: 4,
  password: ''
};

const committeeRoles: { field: CommitteeRole; label: string }[] = [
  { field: 'presidentId', label: 'Chủ tịch' },
  { field: 'reviewer1Id', label: 'Phản biện 1' },
  { field: 'reviewer2Id', label: 'Phản biện 2' },
  { field: 'secretaryId', label: 'Thư ký' },
  { field: 'memberId', label: 'Ủy viên' }
];

const formatDate = (value: string) => {
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

const formatTime = (value: string | null) => {
  if (!value) return 'Chưa xếp';
  const time = value.includes('T') ? value.slice(value.indexOf('T') + 1) : value;
  const match = /^(\d{2}:\d{2})/.exec(time);
  return match ? match[1] : value;
};

const fetchAdminData = async () => {
  const [profileResult, lecturerResult, committeeResult, candidateResult] = await Promise.all([
    api.admission.getAllProfiles(),
    api.admin.getLecturers(),
    api.admin.getCommittees(),
    api.admin.getDefenseCandidates()
  ]);
  if (!profileResult.success || !lecturerResult.success || !committeeResult.success || !candidateResult.success) {
    throw new Error('Máy chủ không thể tải đầy đủ dữ liệu quản trị.');
  }
  return {
    profiles: profileResult.profiles,
    lecturers: lecturerResult.lecturers,
    committees: committeeResult.committees,
    candidates: candidateResult.candidates
  };
};


export const useAdminDashboard = () => {
  const [profiles, setProfiles] = useState<AdmissionProfile[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [committeeRecords, setCommitteeRecords] = useState<AdminCommitteeRecord[]>([]);
  const [defenseCandidates, setDefenseCandidates] = useState<DefenseCandidate[]>([]);
  const [lecturerForm, setLecturerForm] = useState<LecturerInput>(emptyLecturerForm);
  const [editingLecturerId, setEditingLecturerId] = useState<number | null>(null);
  const [isSavingLecturer, setIsSavingLecturer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [issuedAccount, setIssuedAccount] = useState<{
    fullName: string;
    studentCode: string;
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const [committeeForm, setCommitteeForm] = useState({
    committeeName: '',
    defenseDate: '',
    defenseRoom: ''
  });
  const [committeeCandidate, setCommitteeCandidate] = useState('');
  const [committeeDefenseOrder, setCommitteeDefenseOrder] = useState(1);
  const [committeeStartTime, setCommitteeStartTime] = useState('08:00');
  const [activeScoreScheduleId, setActiveScoreScheduleId] = useState<number | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, Partial<Record<EvaluationRole, ScoreDraft>>>>({});
  const [busyScoreScheduleId, setBusyScoreScheduleId] = useState<number | null>(null);
  const [scoreFormError, setScoreFormError] = useState('');
  const [committeeMembers, setCommitteeMembers] = useState<Record<CommitteeRole, string>>({
    presidentId: '',
    reviewer1Id: '',
    reviewer2Id: '',
    secretaryId: '',
    memberId: ''
  });
  const [isCreatingCommittee, setIsCreatingCommittee] = useState(false);
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);

  const filteredProfiles = useMemo(
    () => filterStatus === 'Tất cả' ? profiles : profiles.filter(profile => profile.status === filterStatus),
    [filterStatus, profiles]
  );

  const committees = useMemo(() => {
    const grouped = new Map<number, { committee: AdminCommitteeRecord; schedules: AdminCommitteeRecord[] }>();
    for (const record of committeeRecords) {
      let group = grouped.get(record.committee_id);
      if (!group) {
        group = { committee: record, schedules: [] };
        grouped.set(record.committee_id, group);
      }
      if (record.defense_schedule_id !== null) group.schedules.push(record);
    }
    return Array.from(grouped.values());
  }, [committeeRecords]);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await fetchAdminData();
      setProfiles(data.profiles);
      setLecturers(data.lecturers);
      setCommitteeRecords(data.committees);
      setDefenseCandidates(data.candidates);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    void fetchAdminData()
      .then(data => {
        if (!isCurrent) return;
        setProfiles(data.profiles);
        setLecturers(data.lecturers);
        setCommitteeRecords(data.committees);
        setDefenseCandidates(data.candidates);
      })
      .catch(error => {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleReview = async (profile: AdmissionProfile, status: ReviewStatus) => {
    setBusyProfileId(String(profile.profile_id));
    setActionError('');
    setNotice('');
    setIssuedAccount(null);
    try {
      const result = await api.admission.reviewProfile(profile.profile_id, status);
      if (!result.success) throw new Error(result.message || 'Không thể cập nhật trạng thái hồ sơ.');
      setNotice(`${profile.full_name}: ${result.message}`);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái hồ sơ.');
    } finally {
      setBusyProfileId(null);
    }
  };

  const handleAdmit = async (profile: AdmissionProfile) => {
    const confirmed = window.confirm(`Công nhận trúng tuyển ${profile.full_name} và tạo tài khoản học viên?`);
    if (!confirmed) return;

    setBusyProfileId(String(profile.profile_id));
    setActionError('');
    setNotice('');
    setIssuedAccount(null);
    try {
      const result = await api.admission.admitCandidate(profile.profile_id);
      if (!result.success) throw new Error(result.message || 'Không thể nhập học thí sinh.');
      setIssuedAccount(result.data);
      setNotice(result.message);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể nhập học thí sinh.');
    } finally {
      setBusyProfileId(null);
    }
  };

  const handleEditLecturer = (lecturer: Lecturer) => {
    setEditingLecturerId(lecturer.lecturer_id);
    setLecturerForm({
      username: lecturer.username ?? '',
      lecturerCode: lecturer.lecturer_code,
      fullName: lecturer.full_name,
      degree: lecturer.degree,
      email: lecturer.email,
      phone: lecturer.phone ?? '',
      maxSlots: lecturer.max_slots,
      password: ''
    });
    setActionError('');
    setNotice('');
  };

  const handleCancelLecturerEdit = () => {
    setEditingLecturerId(null);
    setLecturerForm(emptyLecturerForm);
    setActionError('');
  };

  const handleSaveLecturer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError('');
    setNotice('');
    setIsSavingLecturer(true);
    try {
      const payload: LecturerInput = {
        ...lecturerForm,
        password: lecturerForm.password || undefined
      };
      const result = editingLecturerId
        ? await api.admin.updateLecturer(editingLecturerId, payload)
        : await api.admin.createLecturer(payload);
      if (!result.success) throw new Error(result.message || 'Không thể lưu thông tin giảng viên.');

      setNotice(result.message);
      setLecturerForm(emptyLecturerForm);
      setEditingLecturerId(null);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể lưu thông tin giảng viên.');
    } finally {
      setIsSavingLecturer(false);
    }
  };

  const handleDeleteLecturer = async (lecturer: Lecturer) => {
    if (!window.confirm(`Xóa giảng viên ${lecturer.full_name} và tài khoản đăng nhập của giảng viên này?`)) return;
    setActionError('');
    setNotice('');
    try {
      const result = await api.admin.deleteLecturer(lecturer.lecturer_id);
      if (!result.success) throw new Error(result.message || 'Không thể xóa giảng viên.');
      setNotice(result.message);
      if (editingLecturerId === lecturer.lecturer_id) handleCancelLecturerEdit();
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể xóa giảng viên.');
    }
  };

  const handleCreateCommittee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError('');
    setNotice('');

    const memberIds = committeeRoles.map(role => committeeMembers[role.field]);
    if (memberIds.some(id => !id) || new Set(memberIds).size !== committeeRoles.length) {
      setActionError('Vui lòng chọn đủ 5 giảng viên khác nhau cho hội đồng.');
      return;
    }

    setIsCreatingCommittee(true);
    try {
      const result = await api.committee.createCommittee({
        ...committeeForm,
        presidentId: Number(committeeMembers.presidentId),
        reviewer1Id: Number(committeeMembers.reviewer1Id),
        reviewer2Id: Number(committeeMembers.reviewer2Id),
        secretaryId: Number(committeeMembers.secretaryId),
        memberId: Number(committeeMembers.memberId),
        ...(committeeCandidate
          ? {
              thesisId: Number(committeeCandidate),
              defenseOrder: committeeDefenseOrder,
              startTime: committeeStartTime
            }
          : {})
      });
      if (!result.success) throw new Error(result.message || 'Không thể thành lập hội đồng.');
      setNotice(`${result.message} (Mã hội đồng: ${result.committeeId})`);
      setShowCommitteeForm(false);
      setCommitteeForm({ committeeName: '', defenseDate: '', defenseRoom: '' });
      setCommitteeCandidate('');
      setCommitteeDefenseOrder(1);
      setCommitteeStartTime('08:00');
      setCommitteeMembers({
        presidentId: '',
        reviewer1Id: '',
        reviewer2Id: '',
        secretaryId: '',
        memberId: ''
      });
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể thành lập hội đồng.');
    } finally {
      setIsCreatingCommittee(false);
    }
  };

  const toggleScoreForm = async (scheduleId: number, committee: AdminCommitteeRecord) => {
    setActionError('');
    setScoreFormError('');
    if (activeScoreScheduleId === scheduleId) {
      setActiveScoreScheduleId(null);
      return;
    }

    const emptyDrafts = Object.fromEntries(evaluationRoles.map(role => [role.key, emptyScoreDraft()]));
    setScoreDrafts(current => ({ ...current, [scheduleId]: emptyDrafts }));
    setActiveScoreScheduleId(scheduleId);

    try {
      const result = await api.admin.getDefenseEvaluations(scheduleId);
      if (!result.success) throw new Error('Không thể tải các phiếu chấm hiện có.');
      const drafts: Partial<Record<EvaluationRole, ScoreDraft>> = {};
      for (const role of evaluationRoles) {
        const lecturerId = resolveEvaluationLecturerId(role, committee, lecturers);
        const saved = result.evaluations.find(item => item.lecturerId === lecturerId);
        drafts[role.key] = saved
          ? {
              contentScore: String(saved.contentScore),
              presentationScore: String(saved.presentationScore),
              qaScore: String(saved.qaScore),
              feedback: saved.feedback ?? ''
            }
          : emptyScoreDraft();
      }
      setScoreDrafts(current => ({ ...current, [scheduleId]: drafts }));
    } catch (error) {
      setScoreFormError(
        `Không tải được phiếu điểm đã lưu (${error instanceof Error ? error.message : 'lỗi không xác định'}). Bạn vẫn có thể nhập điểm mới.`
      );
    }
  };

  const handleSaveScores = async (
    event: React.FormEvent<HTMLFormElement>,
    scheduleId: number,
    committee: AdminCommitteeRecord
  ) => {
    event.preventDefault();
    const drafts = scoreDrafts[scheduleId] ?? {};
    const evaluations: DefenseEvaluationInput[] = [];
    for (const role of evaluationRoles) {
      const draft = drafts[role.key];
      if (!draft) continue;
      const fields = [draft.contentScore, draft.presentationScore, draft.qaScore];
      if (fields.every(value => value === '')) continue;
      if (fields.some(value => value === '')) {
        const message = `Vui lòng nhập đủ 3 đầu điểm cho ${role.label}, hoặc để trống cả 3.`;
        setScoreFormError(message);
        setActionError(message);
        return;
      }
      const lecturerId = resolveEvaluationLecturerId(role, committee, lecturers);
      if (lecturerId === null) {
        const message = `Không xác định được mã giảng viên ${role.label} (${role.lecturerName(committee)}). Hãy khởi động lại backend rồi tải lại trang.`;
        setScoreFormError(message);
        setActionError(message);
        return;
      }
      evaluations.push({
        lecturerId,
        contentScore: Number(draft.contentScore),
        presentationScore: Number(draft.presentationScore),
        qaScore: Number(draft.qaScore),
        feedback: draft.feedback.trim() || undefined
      });
    }

    if (evaluations.length === 0) {
      const message = 'Nhập điểm cho ít nhất một thành viên hội đồng.';
      setScoreFormError(message);
      setActionError(message);
      return;
    }

    setScoreFormError('');
    setActionError('');
    setNotice('');
    setBusyScoreScheduleId(scheduleId);
    try {
      let successMessage: string;
      try {
        const result = await api.admin.saveDefenseEvaluations(scheduleId, evaluations);
        if (!result.success) throw new Error(result.message || 'Không thể lưu phiếu chấm.');
        const data = result.data;
        successMessage = data.average_score === null
          ? `${result.message} Hiện có ${data.evaluation_count}/5 phiếu chấm.`
          : `${result.message} Điểm trung bình: ${data.average_score}; kết quả: ${data.result}.`;
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('HTTP 404')) throw error;

        for (const evaluation of evaluations) {
          const role = evaluationRoles.find(item => item.lecturerId(committee) === evaluation.lecturerId);
          const result = await api.committee.evaluateDefense({
            defenseScheduleId: scheduleId,
            lecturerId: evaluation.lecturerId,
            roleInCommittee: role?.label ?? '',
            contentScore: evaluation.contentScore,
            presentationScore: evaluation.presentationScore,
            qaScore: evaluation.qaScore,
            feedback: evaluation.feedback
          });
          if (!result.success) throw new Error(result.message || 'Không thể lưu phiếu chấm.', { cause: error });
        }
        const calculated = await api.committee.calculateGrade(scheduleId);
        if (!calculated.success) throw new Error(calculated.message || 'Phiếu đã lưu nhưng không thể cập nhật kết quả.', { cause: error });
        successMessage = `${calculated.message} Đã lưu ${evaluations.length} phiếu chấm. ${
          calculated.data?.average_score === null
            ? 'Cần ít nhất 3 phiếu để có kết quả.'
            : `Điểm trung bình: ${calculated.data.average_score}; kết quả: ${calculated.data.result}.`
        }`;
      }

      setActiveScoreScheduleId(null);
      await loadData();
      alert(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu phiếu chấm.';
      setScoreFormError(message);
      setActionError(message);
    } finally {
      setBusyScoreScheduleId(null);
    }
  };

  return {
    profiles,
    setProfiles,
    lecturers,
    setLecturers,
    committeeRecords,
    setCommitteeRecords,
    defenseCandidates,
    setDefenseCandidates,
    lecturerForm,
    setLecturerForm,
    emptyLecturerForm,
    editingLecturerId,
    setEditingLecturerId,
    isSavingLecturer,
    isLoading,
    loadError,
    actionError,
    setActionError,
    notice,
    setNotice,
    filterStatus,
    setFilterStatus,
    busyProfileId,
    issuedAccount,
    committeeForm,
    setCommitteeForm,
    committeeCandidate,
    setCommitteeCandidate,
    committeeDefenseOrder,
    setCommitteeDefenseOrder,
    committeeStartTime,
    setCommitteeStartTime,
    activeScoreScheduleId,
    scoreDrafts,
    setScoreDrafts,
    busyScoreScheduleId,
    scoreFormError,
    committeeMembers,
    setCommitteeMembers,
    isCreatingCommittee,
    showCommitteeForm,
    setShowCommitteeForm,
    filteredProfiles,
    committees,
    loadData,
    handleReview,
    handleAdmit,
    handleEditLecturer,
    handleCancelLecturerEdit,
    handleSaveLecturer,
    handleDeleteLecturer,
    handleCreateCommittee,
    toggleScoreForm,
    handleSaveScores,
    formatDate,
    formatTime,
    committeeRoles,
    evaluationRoles,
    emptyScoreDraft
  };
};

export type AdminDashboardModel = ReturnType<typeof useAdminDashboard>;
