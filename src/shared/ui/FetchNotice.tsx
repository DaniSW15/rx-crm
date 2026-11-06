import { ApiError } from "../api/http";
import Icon from "./Icon";

export default function FetchNotice({
    error,
    retry,
    busy = false,
}: {
    error: Error;
    retry: () => void;
    busy?: boolean;
}) {
    const unauthorized = error instanceof ApiError && error.status === 401;
    return (
        <div className="fetch-notice" role="alert">
            <Icon name="help" />
            <div>
                <strong>
                    {unauthorized
                        ? "Vuelve a tu espacio de trabajo"
                        : "No pudimos actualizar esta información"}
                </strong>
                <p>
                    {unauthorized
                        ? "Tu sesión ya no es válida. Inicia sesión para continuar."
                        : error.message}
                </p>
            </div>
            {unauthorized ? (
                <a className="ui-button" href="/login">
                    Iniciar sesión
                </a>
            ) : (
                <button className="ui-button" disabled={busy} onClick={retry}>
                    Reintentar
                </button>
            )}
        </div>
    );
}
