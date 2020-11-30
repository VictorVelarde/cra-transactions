import { useSelector } from 'react-redux';
import { CartoSQLLayer } from '@deck.gl/carto';
import { buildQueryFilters } from '@carto/react/api';
import { selectSourceById } from '@carto/react/redux';
import htmlForFeature from 'utils/htmlForFeature';

export default function TransactionsPerRegion() {
  const { transactionsPerRegion } = useSelector((state) => state.carto.layers);
  const source = useSelector((state) =>
    selectSourceById(state, transactionsPerRegion?.source)
  );

  if (transactionsPerRegion && source) {
    return new CartoSQLLayer({
      id: 'transactionsPerRegion',
      data: buildQueryFilters(source),
      credentials: source.credentials,
      getFillColor: [241, 109, 122],
      stroked: true,
      getLineColor: [0, 0, 0],
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      pickable: true,
      onHover: (info) => {
        if (info && info.object) {
          info.object = {
            html: htmlForFeature(info.object),
            style: {},
          };
        }
      },
    });
  }
}
