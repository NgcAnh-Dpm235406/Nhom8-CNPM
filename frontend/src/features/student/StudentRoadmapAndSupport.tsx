import { Award, BookOpenCheck, Check, CircleHelp, FileDown, FileText } from 'lucide-react';
import type {
  StudentAdvisor,
  StudentDefenseResult,
  StudentThesisProgress,
  ThesisMilestoneSubmission,
  TurnitinCheckRecord
} from '../../types';

interface RoadmapProps {
  advisor: StudentAdvisor | null;
  thesis: StudentThesisProgress | null;
  milestones: ThesisMilestoneSubmission[];
  turnitin: TurnitinCheckRecord | null;
  defense: StudentDefenseResult | null;
}

const roadmapStages = [
  'Đăng ký giảng viên hướng dẫn',
  'Bảo vệ đề cương',
  'Báo cáo tiến độ',
  'Nộp bản thảo & Turnitin',
  'Hội đồng bảo vệ'
];

export const ThesisRoadmap = ({ advisor, thesis, milestones, turnitin, defense }: RoadmapProps) => {
  const proposalPassed = milestones.some(item => item.stage_name === 'Bảo vệ đề cương' && item.status === 'Đạt');
  const progressPassed = milestones.some(item =>
    ['Báo cáo tiến độ lần 1', 'Báo cáo tiến độ lần 2'].includes(item.stage_name) && item.status === 'Đạt'
  );
  const manuscriptPassed = milestones.some(item => item.stage_name === 'Nộp bản thảo' && item.status === 'Đạt');
  const thesisStage = thesis?.current_stage || '';
  const pastProposal = ['Báo cáo tiến độ lần 1', 'Báo cáo tiến độ lần 2', 'Nộp bản thảo', 'Bảo vệ chính thức'].includes(thesisStage);
  const pastProgress = ['Nộp bản thảo', 'Bảo vệ chính thức'].includes(thesisStage);
  const manuscriptAndTurnitinPassed = manuscriptPassed && turnitin?.status === 'Đạt';
  const defensePassed = Boolean(defense?.result && defense.result !== 'Chưa bảo vệ');

  const completed = [
    advisor?.status === 'Đang hướng dẫn',
    proposalPassed || pastProposal,
    progressPassed || pastProgress,
    manuscriptAndTurnitinPassed || thesisStage === 'Bảo vệ chính thức',
    defensePassed
  ];
  const currentIndex = completed.findIndex(isComplete => !isComplete);
  const activeIndex = currentIndex;

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Lộ trình luận văn</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Các mốc cần hoàn thành</h3>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
          {completed.filter(Boolean).length}/{roadmapStages.length} mốc hoàn thành
        </span>
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {roadmapStages.map((label, index) => {
          const isComplete = completed[index];
          const isCurrent = !isComplete && index === activeIndex;
          return (
            <li key={label} className="relative min-w-0">
              <div className={`flex h-full flex-col rounded-2xl border p-4 ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50'
                  : isCurrent
                    ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-100'
                    : 'border-slate-200 bg-slate-50'
              }`}>
                <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isComplete
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                }`}>
                  {isComplete ? <Check className="h-4 w-4" aria-label="Hoàn thành" /> : index + 1}
                </span>
                <span className="text-sm font-bold text-slate-800">{label}</span>
                <span className={`mt-2 text-xs font-semibold ${
                  isComplete ? 'text-emerald-700' : isCurrent ? 'text-sky-700' : 'text-slate-500'
                }`}>
                  {isComplete ? 'Đã hoàn thành' : isCurrent ? 'Mốc hiện tại' : 'Chưa đến'}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

interface SupportProps {
  defenseLoading: boolean;
  defense: StudentDefenseResult | null;
  section: 'forms' | 'defense';
}

const formatDate = (date: string) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('vi-VN');
};

const formatTime = (time: string) => time.includes('T') ? time.slice(11, 16) : time.slice(0, 5);

export const StudentSupportSection = ({ defense, defenseLoading, section }: SupportProps) => (
  <div className="space-y-6">
    {section === 'forms' && (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
            <FileDown className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Kho biểu mẫu và quy định SĐH</h3>
            <p className="mt-1 text-sm text-slate-500">Tải mẫu về, điền thông tin và nộp theo hướng dẫn của Phòng Sau Đại học.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { title: 'Mẫu đề cương luận văn', href: '/forms/mau-de-cuong-luan-van.rtf' },
            { title: 'Mẫu đơn xin bảo vệ', href: '/forms/mau-don-xin-bao-ve.rtf' },
            { title: 'Phiếu giải trình chỉnh sửa luận văn', href: '/forms/phieu-giai-trinh-chinh-sua-luan-van.rtf' }
          ].map(form => (
            <a
              key={form.href}
              href={form.href}
              download
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="flex items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-800">{form.title}</span>
              </span>
              <FileDown className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-sky-700" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Tệp RTF có thể mở và chỉnh sửa bằng Microsoft Word hoặc LibreOffice.</p>
      </section>
    )}

    {section === 'defense' && (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
            <Award className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hội đồng bảo vệ và kết quả</h3>
            <p className="mt-1 text-sm text-slate-500">Lịch bảo vệ, thành viên hội đồng, điểm trung bình và nhận xét phản biện.</p>
          </div>
        </div>

        {defenseLoading ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Đang tải thông tin hội đồng...</p>
        ) : !defense ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <CircleHelp className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            Chưa có lịch bảo vệ được phân công cho luận văn của bạn.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Hội đồng', defense.committee_name],
                ['Ngày bảo vệ', formatDate(defense.defense_date)],
                ['Thời gian / thứ tự', `${formatTime(String(defense.start_time))} · Lượt ${defense.defense_order}`],
                ['Địa điểm', defense.defense_room]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <BookOpenCheck className="h-4 w-4 text-sky-700" aria-hidden="true" />
                  Thành viên hội đồng
                </h4>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {defense.members.map(member => (
                    <li key={`${member.role}-${member.full_name}`} className="flex justify-between gap-3 p-3 text-sm">
                      <span className="text-slate-500">{member.role}</span>
                      <span className="text-right font-medium text-slate-800">{member.degree} {member.full_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-800">Điểm và nhận xét</h4>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">
                    TB: {defense.average_score ?? 'Chưa có'}
                  </span>
                </div>
                {defense.evaluations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Hội đồng chưa gửi phiếu đánh giá.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {defense.evaluations.map(evaluation => (
                      <li key={`${evaluation.role_in_committee}-${evaluation.full_name}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <span className="font-semibold text-slate-800">{evaluation.role_in_committee} · {evaluation.full_name}</span>
                          <span className="font-bold text-sky-700">{evaluation.total_score}/10</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {evaluation.feedback || 'Chưa có nhận xét.'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Kết quả: {defense.result || 'Chưa có kết quả'}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    )}
  </div>
);
