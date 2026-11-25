import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { Room, RoomTutor } from '@/types/room';
import type { Problem } from '@/types/problem';
import type { RoomHeading } from '@/services/memberRoom.service';

async function findEligibleTutors(roomId: string, userId?: string) {
  const tutors = await roomService.listTutors(roomId);
  return (tutors ?? []).filter((t) => t.id !== userId);
}

function useTransferFlow(roomId: string | undefined, userId: string | undefined) {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTransferPending, setIsTransferPending] = useState(false);
  const [eligibleTutors, setEligibleTutors] = useState<RoomTutor[]>([]);

  const openTransfer = async () => {
    if (!roomId) return;
    try {
      const eligible = await findEligibleTutors(roomId, userId);
      setEligibleTutors(eligible);
      setIsTransferOpen(true);
    } catch {
      setEligibleTutors([]);
      setIsTransferOpen(true);
    }
  };

  const resumeTransfer = async () => {
    if (!roomId) return;
    setIsTransferPending(false);
    const eligible = await findEligibleTutors(roomId, userId);
    setEligibleTutors(eligible);
    setIsTransferOpen(true);
  };

  return {
    isTransferOpen,
    setIsTransferOpen,
    isTransferPending,
    setIsTransferPending,
    eligibleTutors,
    openTransfer,
    resumeTransfer,
  };
}

function useInviteModal(transfer: ReturnType<typeof useTransferFlow>) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState<'alunos' | 'professores'>('alunos');

  const openInviteStudents = () => {
    setInviteTab('alunos');
    setIsInviteOpen(true);
  };

  const startInviteCoTutor = () => {
    transfer.setIsTransferOpen(false);
    transfer.setIsTransferPending(true);
    setInviteTab('professores');
    setIsInviteOpen(true);
  };

  const closeInvite = () => {
    setIsInviteOpen(false);
    if (transfer.isTransferPending) transfer.resumeTransfer();
  };

  const handleTutorAdded = () => {
    if (transfer.isTransferPending) {
      setIsInviteOpen(false);
      transfer.resumeTransfer();
    }
  };

  return {
    isInviteOpen,
    inviteTab,
    openInviteStudents,
    startInviteCoTutor,
    closeInvite,
    handleTutorAdded,
  };
}

export function useRoomProblemsModals(
  roomId: string | undefined,
  userId: string | undefined,
  setRoom: React.Dispatch<React.SetStateAction<Room | RoomHeading | null>>,
  setProblems: React.Dispatch<React.SetStateAction<Problem[]>>,
) {
  const { notify } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const transfer = useTransferFlow(roomId, userId);
  const invite = useInviteModal(transfer);

  const handleCreateSuccess = (newProblem: Problem) => {
    setProblems((curr) => [...curr, newProblem]);
    setIsCreateOpen(false);
    notify({ tone: 'success', message: 'Problema criado com sucesso!' });
  };

  const handleTransferred = (newOwnerId: string) => {
    setRoom((prev) => (prev ? { ...prev, professorResponsavelId: newOwnerId } : null));
  };

  return {
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    handleCreateSuccess,
    isInviteOpen: invite.isInviteOpen,
    openInviteStudents: invite.openInviteStudents,
    closeInvite: invite.closeInvite,
    inviteTab: invite.inviteTab,
    isTransferOpen: transfer.isTransferOpen,
    closeTransfer: () => transfer.setIsTransferOpen(false),
    eligibleTutors: transfer.eligibleTutors,
    handleTransferClick: transfer.openTransfer,
    handleTransferred,
    startInviteCoTutor: invite.startInviteCoTutor,
    handleTutorAdded: invite.handleTutorAdded,
  };
}
