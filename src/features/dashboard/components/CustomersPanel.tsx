import { Link } from "react-router";
import Icon from "../../../shared/ui/Icon";
import FetchNotice from "../../../shared/ui/FetchNotice";
import type { Customer } from "../../customers";

export default function CustomersPanel({
    customers,
    error,
    pending,
    busy,
    retry,
}: {
    customers: Customer[];
    error: Error | null;
    pending: boolean;
    busy: boolean;
    retry: () => void;
}) {
    return (
        <section className="surface customer-panel">
            <div className="panel-heading">
                <div>
                    <h2>Últimos clientes</h2>
                    <p>Relaciones con nombre propio.</p>
                </div>
                <Link className="icon-button" aria-label="Ver todos los clientes" to="/customers">
                    <Icon name="arrow" size={19} />
                </Link>
            </div>
            {error && <FetchNotice error={error} retry={retry} busy={busy} />}
            <div className="customer-list">
                {customers.map((customer, index) => (
                    <Link className="customer-list__item" key={customer.id} to="/customers">
                        <span className={`customer-avatar avatar-tone-${index % 3}`}>
                            {customer.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                            <strong>{customer.name}</strong>
                            <small>
                                {customer.industry ||
                                    customer.phone ||
                                    "Cliente de tu organización"}
                            </small>
                        </span>
                        <Icon name="arrow" size={16} />
                    </Link>
                ))}
            </div>
            {pending && (
                <p className="empty-panel" role="status">
                    Cargando clientes…
                </p>
            )}
            {!pending && !error && customers.length === 0 && (
                <p className="empty-panel">
                    Tus clientes aparecerán aquí cuando se registren en tu organización.
                </p>
            )}
            <div className="relationship-note">
                <span className="relationship-mark">
                    <Icon name="customers" size={28} />
                </span>
                <p>
                    Detrás de cada venta,
                    <br />
                    <strong>hay una buena relación.</strong>
                </p>
            </div>
        </section>
    );
}
