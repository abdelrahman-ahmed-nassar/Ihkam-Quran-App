import { resetAppData } from "../lib/reset-service-worker";

type UpdateQuranDataButtonProps = {
  disabled?: boolean;
  onRefresh: () => Promise<void>;
};

export const UpdateQuranDataButton = ({
  disabled = false,
  onRefresh,
}: UpdateQuranDataButtonProps) => {
  const handleUpdate = async () => {
    await onRefresh();
    await resetAppData();
  };

  return (
    <button
      type="button"
      onClick={() => void handleUpdate()}
      disabled={disabled}
      className="rounded-md border border-text-main/20 px-3 py-2 text-sm font-medium text-text-main transition hover:bg-text-main/5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      تحديث
    </button>
  );
};
