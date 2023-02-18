// import getDBOverView from 'api/metrics/getDBOverView';
// import getExternalAverageDuration from 'api/metrics/getExternalAverageDuration';
// import getExternalError from 'api/metrics/getExternalError';
// import getExternalService from 'api/metrics/getExternalService';
import getServiceOverview from 'api/metrics/getServiceOverview';
import getTopLevelOperations from 'api/metrics/getTopLevelOperations';
import getTopOperations from 'api/metrics/getTopOperations';
import { AxiosError } from 'axios';
import GetMinMax from 'lib/getMinMax';
import getStep from 'lib/getStep';
import { Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { Props } from 'types/api/metrics/getDBOverview';
import { GlobalReducer } from 'types/reducer/globalTime';
import { Tags } from 'types/reducer/trace';

export const GetInitialData = (
	props: GetInitialDataProps,
): ((
	dispatch: Dispatch<AppActions>,
	getState: () => AppState,
) => void) => async (dispatch, getState): Promise<void> => {
	try {
		const { globalTime } = getState();

		/**
		 * @description This is because we keeping the store as source of truth
		 */
		if (
			props.maxTime !== globalTime.maxTime &&
			props.minTime !== globalTime.minTime
		) {
			return;
		}

		dispatch({
			type: 'GET_INITIAL_APPLICATION_LOADING',
		});

		const { maxTime, minTime } = GetMinMax(globalTime.selectedTime, [
			globalTime.minTime / 1000000,
			globalTime.maxTime / 1000000,
		]);

		const [
			// getDBOverViewResponse,
			// getExternalAverageDurationResponse,
			// getExternalErrorResponse,
			// getExternalServiceResponse,
			getServiceOverviewResponse,
			getTopOperationsResponse,
			getTopLevelOperationsResponse,
		] = await Promise.all([
			// getDBOverView({
			// 	...props,
			// }),
			// getExternalAverageDuration({
			// 	...props,
			// }),
			// getExternalError({
			// 	...props,
			// }),
			// getExternalService({
			// 	...props,
			// }),
			getServiceOverview({
				end: maxTime,
				service: props.serviceName,
				start: minTime,
				step: getStep({ start: minTime, end: maxTime, inputFormat: 'ns' }),
				selectedTags: props.selectedTags,
			}),
			getTopOperations({
				end: maxTime,
				service: props.serviceName,
				start: minTime,
				selectedTags: props.selectedTags,
			}),
			getTopLevelOperations({
				service: props.serviceName,
			}),
		]);

		if (
			// getDBOverViewResponse.statusCode === 200 &&
			// getExternalAverageDurationResponse.statusCode === 200 &&
			// getExternalErrorResponse.statusCode === 200 &&
			// getExternalServiceResponse.statusCode === 200 &&
			getServiceOverviewResponse.statusCode === 200 &&
			getTopOperationsResponse.statusCode === 200 &&
			getTopLevelOperationsResponse.statusCode === 200
		) {
			dispatch({
				type: 'GET_INTIAL_APPLICATION_DATA',
				payload: {
					// dbOverView: getDBOverViewResponse.payload,
					// externalAverageDuration: getExternalAverageDurationResponse.payload,
					// externalError: getExternalErrorResponse.payload,
					// externalService: getExternalServiceResponse.payload,
					serviceOverview: getServiceOverviewResponse.payload,
					topOperations: getTopOperationsResponse.payload,
					topLevelOperations: getTopLevelOperationsResponse.payload,
				},
			});
		} else {
			dispatch({
				type: 'GET_INITIAL_APPLICATION_ERROR',
				payload: {
					errorMessage:
						getTopOperationsResponse.error ||
						getServiceOverviewResponse.error ||
						getTopLevelOperationsResponse.error ||
						// getExternalServiceResponse.error ||
						// getExternalErrorResponse.error ||
						// getExternalAverageDurationResponse.error ||
						// getDBOverViewResponse.error ||
						'Something went wrong',
				},
			});
		}
	} catch (error) {
		dispatch({
			type: 'GET_INITIAL_APPLICATION_ERROR',
			payload: {
				errorMessage: (error as AxiosError).toString() || 'Something went wrong',
			},
		});
	}
};

export interface GetInitialDataProps {
	serviceName: Props['service'];
	maxTime: GlobalReducer['maxTime'];
	minTime: GlobalReducer['minTime'];
	selectedTags: Tags[];
}
