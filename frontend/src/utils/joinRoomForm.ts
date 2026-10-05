import type { FieldErrors } from '@/hooks/useForm';

export type JoinRoomFormValues = {
  codigo: string;
};

export type JoinRoomRequest = { kind: 'code'; codigoSala: string } | { kind: 'link'; link: string };

// Mirrors the backend contract: room codes are 8 case-sensitive alphanumeric characters,
// and invite links end in /salas/{codigoSala}.
const ROOM_CODE_PATTERN = /^[A-Za-z0-9]{8}$/;
const INVITE_LINK_PATTERN = /^https?:\/\/[^/\s?#]+\/salas\/[A-Za-z0-9]{8}\/?(?:[?#]\S*)?$/;

export function toJoinRoomRequest(input: string): JoinRoomRequest | null {
  const value = input.trim();
  if (ROOM_CODE_PATTERN.test(value)) return { kind: 'code', codigoSala: value };
  if (INVITE_LINK_PATTERN.test(value)) return { kind: 'link', link: value };
  return null;
}

export function validateJoinRoomForm(values: JoinRoomFormValues): FieldErrors<JoinRoomFormValues> {
  if (!values.codigo.trim()) return { codigo: 'Informe o código da turma.' };
  if (!toJoinRoomRequest(values.codigo)) {
    return { codigo: 'O código deve ter 8 letras ou números (ex.: aB7kP2x9).' };
  }
  return {};
}
