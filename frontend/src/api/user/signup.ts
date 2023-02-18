import axios from 'api';
import { ErrorResponseHandler } from 'api/ErrorResponseHandler';
import { AxiosError } from 'axios';
import { ErrorResponse, SuccessResponse } from 'types/api';
import * as loginPrecheck from 'types/api/user/loginPrecheck';
import { Props } from 'types/api/user/signup';

const signup = async (
	props: Props,
): Promise<
	SuccessResponse<null | loginPrecheck.PayloadProps> | ErrorResponse
> => {
	try {
		const response = await axios.post(`/register`, {
			...props,
		});
		console.log(' response.data.data', response.data.data);
		return {
			statusCode: 200,
			error: null,
			message: response.data.status,
			payload: response.data?.data,
		};
	} catch (error) {
		return ErrorResponseHandler(error as AxiosError);
	}
};

export default signup;
