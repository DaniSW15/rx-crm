import { ApiError } from "../../../shared/api/http";

interface MoveErrorNoticeProps {
    error: Error;
    onDismiss: () => void;
}

export default function MoveErrorNotice({ error, onDismiss }: MoveErrorNoticeProps) {
    const status = error instanceof ApiError ? error.status : undefined;
    let hint = "Se descartó el cambio local. Puedes actualizar el tablero para consultar el estado actual.";
    if (status === 401) {
        hint = "Tu sesión no es válida. Inicia sesión de nuevo para continuar.";
    } else if (status === 403) {
        hint = "Tu usuario no tiene permiso para realizar este movimiento.";
    } else if (status === 409) {
        hint = "La oportunidad cambió mientras la estabas moviendo. Actualiza el tablero y revisa su estado antes de volver a intentarlo.";
    } else if (status === undefined || status >= 500) {
        hint = "No se pudo confirmar el movimiento. Actualiza el tablero antes de volver a intentarlo.";
    }

    return (
        <div role="alert" className="kanban-notice kanban-notice--error">
            <p><strong>No se pudo mover la oportunidad:</strong> {error.message}</p>
            <p>{hint}</p>
            <div className="kanban-notice__actions">
                {status === 401 && <a className="kanban-button" href="/login">Iniciar sesión</a>}
                <button className="kanban-button" type="button" onClick={onDismiss}>Cerrar aviso</button>
            </div>
        </div>
    );
}
