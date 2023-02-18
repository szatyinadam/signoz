import getDashboard from 'api/dashboard/get';
import {
	ClickHouseQueryTemplate,
	PromQLQueryTemplate,
	QueryBuilderQueryTemplate,
} from 'constants/dashboard';
import { GRAPH_TYPES } from 'container/NewDashboard/ComponentsSlider';
import GetQueryName from 'lib/query/GetQueryName';
import { Dispatch } from 'redux';
import AppActions from 'types/actions';
import { Props } from 'types/api/dashboard/get';
import { EQueryType } from 'types/common/dashboard';

export const GetDashboard = ({
	uuid,
	widgetId,
	graphType,
}: GetDashboardProps): ((dispatch: Dispatch<AppActions>) => void) => async (
	dispatch: Dispatch<AppActions>,
): Promise<void> => {
	try {
		dispatch({
			type: 'GET_DASHBOARD_LOADING_START',
		});

		const response = await getDashboard({
			uuid,
		});

		if (response.statusCode === 200) {
			dispatch({
				payload: response.payload,
				type: 'GET_DASHBOARD_SUCCESS',
			});

			if (widgetId !== undefined) {
				dispatch({
					type: 'CREATE_DEFAULT_WIDGET',
					payload: {
						description: '',
						id: widgetId,
						isStacked: false,
						nullZeroValues: 'zero',
						opacity: '0',
						panelTypes: graphType || 'TIME_SERIES',
						timePreferance: 'GLOBAL_TIME',
						title: '',
						queryType: 0,
						queryData: {
							data: {
								queryData: [],
							},

							error: false,
							errorMessage: '',
							loading: false,
						},
						query: {
							queryType: EQueryType.QUERY_BUILDER,
							promQL: [
								{
									name: GetQueryName([]) as string,
									...PromQLQueryTemplate,
								},
							],
							clickHouse: [
								{
									name: GetQueryName([]) as string,
									...ClickHouseQueryTemplate,
								},
							],
							metricsBuilder: {
								formulas: [],
								queryBuilder: [
									{
										name: GetQueryName([]) as string,
										...QueryBuilderQueryTemplate,
									},
								],
							},
						},
					},
				});
			}
		} else {
			dispatch({
				type: 'GET_DASHBOARD_ERROR',
				payload: {
					errorMessage: response.error || 'Something went wrong',
				},
			});
		}
	} catch (error) {
		dispatch({
			type: 'GET_DASHBOARD_ERROR',
			payload: {
				errorMessage:
					error instanceof Error ? error.toString() : 'Something went wrong',
			},
		});
	}
};

export interface GetDashboardProps {
	uuid: Props['uuid'];
	widgetId?: string;
	graphType?: GRAPH_TYPES;
}
