import { useEffect, useState } from 'react';
import { getEquipment } from '../../api/endpoints';

const TYPE_LABELS = { onu: 'ONU', router: 'Router CPE', antenna: 'Antena' };

export default function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEquipment()
      .then(({ data }) => setEquipment(data.results ?? data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Inventario</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Tipo</th><th>Marca/Modelo</th><th>N° Serie</th><th>Estado</th><th>Cliente asignado</th></tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq.id}>
                <td>{TYPE_LABELS[eq.equipment_type]}</td>
                <td>{eq.brand} {eq.model}</td>
                <td>{eq.serial_number}</td>
                <td>{eq.status}</td>
                <td>{eq.assigned_client_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
