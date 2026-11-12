import { ABOUT_PROJECT_COURSE, ABOUT_PROJECT_SUMMARY, TEAM_MEMBERS } from '@/content/projectInfo';

export function AboutProjectContent() {
  return (
    <div className="flex flex-col gap-3 text-left text-sm leading-relaxed text-muted">
      <p>{ABOUT_PROJECT_SUMMARY}</p>
      <p>{ABOUT_PROJECT_COURSE}</p>
    </div>
  );
}

export function TeamMembersContent() {
  return (
    <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
      {TEAM_MEMBERS.map((member) => (
        <li key={member.github}>
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
          >
            <span>{member.name}</span>
            <span className="text-xs text-muted underline">GitHub &rarr;</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
