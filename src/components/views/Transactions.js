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

  const SOURCE_ID = `transactionsPerRegionSource`;
  const LAYER_ID = `transactionsPerRegion`;

  const SQL_SOURCE = `
    SELECT 
      r.cartodb_id,
      r.name, 
      r.the_geom_webmercator,
      SUM(t.amount) as amount_sum,
      AVG(t.amount) as amount_avg,
      COUNT(*) as count
    FROM regions as r JOIN 
      transactions as t
      ON ST_Intersects(r.the_geom_webmercator, t.the_geom_webmercator)
    GROUP BY 
      r.cartodb_id,
      r.name, 
      r.the_geom_webmercator
    `;

  useEffect(() => {
    // Add the source
    dispatch(
      addSource({
        id: SOURCE_ID,
        data: SQL_SOURCE,
        type: 'sql',
      })
    );

    // Add the layer
    dispatch(
      addLayer({
        id: LAYER_ID,
        source: SOURCE_ID,
      })
    );

    // Cleanup
    return function cleanup() {
      dispatch(removeLayer(LAYER_ID));
      dispatch(removeSource(SOURCE_ID));
    };
  }, [dispatch, SOURCE_ID, LAYER_ID, SQL_SOURCE]);

  return (
    <Grid container direction='row' className={classes.root}>
      <FormulaWidget
        title='Total amount'
        dataSource={SOURCE_ID}
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
