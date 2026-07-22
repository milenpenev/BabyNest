import { AlertTriangle, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActivityDeleteDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ActivityDeleteDialog({
  isOpen,
  onCancel,
  onConfirm,
}: ActivityDeleteDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-activity-title"
        aria-describedby="delete-activity-description"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="delete-activity-title"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                {t("activity.deleteTitle")}
              </h2>

              <p
                id="delete-activity-description"
                className="mt-1 text-sm leading-6 text-slate-500"
              >
                {t("activity.deleteDescription")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t("activity.close")}
            title={t("activity.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("activity.keepActivity")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700"
          >
            <Trash2 className="h-5 w-5" />
            {t("activity.confirmDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}