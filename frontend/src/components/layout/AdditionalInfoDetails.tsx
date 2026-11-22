import {
  ABOUT_PROJECT_COURSE,
  ABOUT_PROJECT_SUMMARY,
  PROJECT_EMAIL,
  TEAM_MEMBERS,
} from '@/content/projectInfo';

export function AboutProjectContent() {
  return (
    <div className="flex flex-col gap-3 text-left text-sm leading-relaxed text-muted">
      <p>{ABOUT_PROJECT_SUMMARY}</p>
      <p>{ABOUT_PROJECT_COURSE}</p>
      <p>
        Contato:{' '}
        <a
          href={`mailto:${PROJECT_EMAIL}`}
          className="font-medium text-brand-900 underline underline-offset-4 transition-colors hover:text-brand-700"
        >
          {PROJECT_EMAIL}
        </a>
      </p>
    </div>
  );
}

export function TeamMembersContent() {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 py-1 text-center sm:grid-cols-2">
      {TEAM_MEMBERS.map((member) => (
        <li key={member.github} className="text-center">
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium text-brand-900 underline underline-offset-4 transition-colors hover:text-brand-700"
          >
            {member.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
