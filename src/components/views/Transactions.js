import React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addLayer, removeLayer, addSource, removeSource } from '@carto/react/redux';

import { AggregationTypes } from '@carto/react/widgets';
import { FormulaWidget, CategoryWidget, HistogramWidget } from '@carto/react/widgets';

import { makeStyles } from '@material-ui/core/styles';
import { Divider, Grid } from '@material-ui/core';

import { currencyFormatter, numberFormatter } from 'utils/formatter';

const useStyles = makeStyles((theme) => ({
  root: {},
}));

export default function Transactions() {
  const dispatch = useDispatch();
  const classes = useStyles();

  const AGGREGATED_SOURCE_ID = `transactionsPerRegionSource`;
  const AGGREGATED_LAYER_ID = `transactionsPerRegion`;

  let transactions_sql = `
    SELECT 
      t.amount, 
      t.type, 
      t.the_geom_webmercator 
    FROM transactions as t`;

  const SQL_SOURCE = `
    SELECT 
      r.cartodb_id,
      r.name, 
      r.the_geom_webmercator,
      SUM(t.amount) as amount_sum,
      AVG(t.amount) as amount_avg,
      COUNT(*) as count
    FROM regions as r JOIN 
      (${transactions_sql}) as t
      ON ST_Intersects(r.the_geom_webmercator, t.the_geom_webmercator)
    GROUP BY 
      r.cartodb_id,
      r.name, 
      r.the_geom_webmercator
  `;

  useEffect(() => {
    // Add the aggregated source
    dispatch(
      addSource({
        id: AGGREGATED_SOURCE_ID,
        data: SQL_SOURCE,
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
  }, [dispatch, AGGREGATED_SOURCE_ID, AGGREGATED_LAYER_ID, SQL_SOURCE]);

  return (
    <Grid container direction='row' className={classes.root}>
      <FormulaWidget
        title='Total amount'
        dataSource={AGGREGATED_SOURCE_ID}
        column='amount_sum'
        operation={AggregationTypes.SUM}
        formatter={currencyFormatter}
        viewportFilter
        onError={console.error}
      ></FormulaWidget>

      <Divider />
    </Grid>
  );
}
