import React from 'react';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addLayer,
  removeLayer,
  addSource,
  removeSource,
  selectSourceById,
} from '@carto/react/redux';
import { buildQueryFilters } from '@carto/react/api';

import { AggregationTypes } from '@carto/react/widgets';
import { FormulaWidget, CategoryWidget, HistogramWidget } from '@carto/react/widgets';

import { Divider } from '@material-ui/core';

import { currencyFormatter, numberFormatter } from 'utils/formatter';

export default function Transactions() {
  const TRANSACTIONS_SOURCE_ID = 'transactionsSource';
  const AGGREGATED_SOURCE_ID = `transactionsPerRegionSource`;

  const transactionsSource = useSelector((state) =>
    selectSourceById(state, TRANSACTIONS_SOURCE_ID)
  );
  const dispatch = useDispatch();

  // 1. Create a pure source, just for widgets
  const TRANSACTIONS_SQL_SOURCE = `
    SELECT 
      amount, 
      type, 
      the_geom_webmercator 
    FROM transactions`;

  useEffect(() => {
    // Add the disaggregated, original source
    dispatch(
      addSource({
        id: TRANSACTIONS_SOURCE_ID,
        data: TRANSACTIONS_SQL_SOURCE,
        type: 'sql',
      })
    );
    // Cleanup
    return function cleanup() {
      dispatch(removeSource(TRANSACTIONS_SOURCE_ID));
    };
  }, [dispatch, TRANSACTIONS_SOURCE_ID, TRANSACTIONS_SQL_SOURCE]);

  // 2. Create a source for the aggregations per region (for the layer)
  const AGGREGATED_SQL_SOURCE = `
    SELECT 
      r.cartodb_id,
      r.name, 
      r.the_geom_webmercator,
      SUM(t.amount) as transactions_sum,
      AVG(t.amount) as transactions_avg,
      COUNT(*) as transactions_count
    FROM regions as r JOIN 
      (${TRANSACTIONS_SQL_SOURCE}) as t
      ON ST_Intersects(r.the_geom_webmercator, t.the_geom_webmercator)
    GROUP BY 
      r.cartodb_id,
      r.name, 
      r.the_geom_webmercator
  `;
  const AGGREGATED_LAYER_ID = `transactionsPerRegion`;

  useEffect(() => {
    // Add the aggregated source
    dispatch(
      addSource({
        id: AGGREGATED_SOURCE_ID,
        data: AGGREGATED_SQL_SOURCE,
        type: 'sql',
      })
    );

    // Add the aggregated layer
    dispatch(
      addLayer({
        id: AGGREGATED_LAYER_ID,
        source: AGGREGATED_SOURCE_ID,
      })
    );

    // Cleanup
    return function cleanup() {
      dispatch(removeLayer(AGGREGATED_LAYER_ID));
      dispatch(removeSource(AGGREGATED_SOURCE_ID));
    };
  }, [dispatch, AGGREGATED_SOURCE_ID, AGGREGATED_LAYER_ID, AGGREGATED_SQL_SOURCE]);

  return (
    <div>
      <FormulaWidget
        title='Total amount'
        dataSource={TRANSACTIONS_SOURCE_ID}
        column='amount'
        operation={AggregationTypes.SUM}
        formatter={currencyFormatter}
        viewportFilter
        onError={console.error}
      ></FormulaWidget>

      <Divider />

      <CategoryWidget
        id='transactionsByType'
        title='Amount by transaction type'
        dataSource={TRANSACTIONS_SOURCE_ID}
        column='type'
        operationColumn='amount'
        operation={AggregationTypes.SUM}
        formatter={currencyFormatter}
        viewportFilter
        onError={console.error}
      />

      <Divider />

      <HistogramWidget
        id='transactionsByAmount'
        title='Transactions by amount'
        dataSource={TRANSACTIONS_SOURCE_ID}
        formatter={numberFormatter}
        xAxisFormatter={currencyFormatter}
        operation={AggregationTypes.COUNT}
        column='amount'
        ticks={[1200000, 1300000, 1400000, 1500000, 1600000, 1700000, 1800000]}
        viewportFilter
        onError={console.error}
      ></HistogramWidget>

      <Divider />

      {/* SQL for debugging */}
      <div style={{ padding: 20 }}>
        {transactionsSource && buildQueryFilters(transactionsSource)}
      </div>
    </div>
  );
}
