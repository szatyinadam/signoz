import { Button, Input, Space, Switch, Typography } from 'antd';
import editOrg from 'api/user/editOrg';
import getInviteDetails from 'api/user/getInviteDetails';
import loginApi from 'api/user/login';
import signUpApi from 'api/user/signup';
import afterLogin from 'AppRoutes/utils';
import WelcomeLeftContainer from 'components/WelcomeLeftContainer';
import ROUTES from 'constants/routes';
import { useNotifications } from 'hooks/useNotifications';
import history from 'lib/history';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';
import { SuccessResponse } from 'types/api';
import { PayloadProps } from 'types/api/user/getUser';
import * as loginPrecheck from 'types/api/user/loginPrecheck';

import { ButtonContainer, FormWrapper, Label, MarginTop } from './styles';
import { isPasswordNotValidMessage, isPasswordValid } from './utils';

const { Title } = Typography;

function SignUp({ version }: SignUpProps): JSX.Element {
	const { t } = useTranslation(['signup']);
	const [loading, setLoading] = useState(false);

	const [precheck, setPrecheck] = useState<loginPrecheck.PayloadProps>({
		sso: false,
		isUser: false,
	});

	const [firstName, setFirstName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [organizationName, setOrganizationName] = useState<string>('');
	const [hasOptedUpdates, setHasOptedUpdates] = useState<boolean>(true);
	const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [confirmPasswordError, setConfirmPasswordError] = useState<boolean>(
		false,
	);
	const [isPasswordPolicyError, setIsPasswordPolicyError] = useState<boolean>(
		false,
	);
	const { search } = useLocation();
	const params = new URLSearchParams(search);
	const token = params.get('token');
	const [isDetailsDisable, setIsDetailsDisable] = useState<boolean>(false);

	const getInviteDetailsResponse = useQuery({
		queryFn: () =>
			getInviteDetails({
				inviteId: token || '',
			}),
		queryKey: 'getInviteDetails',
		enabled: token !== null,
	});

	const { notifications } = useNotifications();

	useEffect(() => {
		if (
			getInviteDetailsResponse.status === 'success' &&
			getInviteDetailsResponse.data.payload
		) {
			const responseDetails = getInviteDetailsResponse.data.payload;
			if (responseDetails.precheck) setPrecheck(responseDetails.precheck);
			setFirstName(responseDetails.name);
			setEmail(responseDetails.email);
			setOrganizationName(responseDetails.organization);
			setIsDetailsDisable(true);
		}
		if (
			getInviteDetailsResponse.status === 'success' &&
			getInviteDetailsResponse.data?.error
		) {
			const { error } = getInviteDetailsResponse.data;
			notifications.error({
				message: error,
			});
		}
	}, [
		getInviteDetailsResponse.data?.payload,
		getInviteDetailsResponse.data?.error,
		getInviteDetailsResponse.status,
		getInviteDetailsResponse,
		notifications,
	]);

	const setState = (
		value: string,
		setFunction: React.Dispatch<React.SetStateAction<string>>,
	): void => {
		setFunction(value);
	};

	const isPreferenceVisible = token === null;

	const commonHandler = async (
		callback: (e: SuccessResponse<PayloadProps>) => Promise<void> | VoidFunction,
	): Promise<void> => {
		try {
			const response = await signUpApi({
				email,
				name: firstName,
				orgName: organizationName,
				password,
				token: params.get('token') || undefined,
			});

			if (response.statusCode === 200) {
				const loginResponse = await loginApi({
					email,
					password,
				});

				if (loginResponse.statusCode === 200) {
					const { payload } = loginResponse;
					const userResponse = await afterLogin(
						payload.userId,
						payload.accessJwt,
						payload.refreshJwt,
					);
					if (userResponse) {
						callback(userResponse);
					}
				} else {
					notifications.error({
						message: loginResponse.error || t('unexpected_error'),
					});
				}
			} else {
				notifications.error({
					message: response.error || t('unexpected_error'),
				});
			}
		} catch (error) {
			notifications.error({
				message: t('unexpected_error'),
			});
		}
	};

	const onAdminAfterLogin = async (
		userResponse: SuccessResponse<PayloadProps>,
	): Promise<void> => {
		const editResponse = await editOrg({
			isAnonymous,
			name: organizationName,
			hasOptedUpdates,
			orgId: userResponse.payload.orgId,
		});
		if (editResponse.statusCode === 200) {
			history.push(ROUTES.APPLICATION);
		} else {
			notifications.error({
				message: editResponse.error || t('unexpected_error'),
			});
		}
	};
	const handleSubmitSSO = async (
		e: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		if (!params.get('token')) {
			notifications.error({
				message: t('token_required'),
			});
			return;
		}
		setLoading(true);

		try {
			e.preventDefault();
			const response = await signUpApi({
				email,
				name: firstName,
				orgName: organizationName,
				password,
				token: params.get('token') || undefined,
				sourceUrl: encodeURIComponent(window.location.href),
			});

			if (response.statusCode === 200) {
				if (response.payload?.sso) {
					if (response.payload?.ssoUrl) {
						window.location.href = response.payload?.ssoUrl;
					} else {
						notifications.error({
							message: t('failed_to_initiate_login'),
						});
						// take user to login page as there is nothing to do here
						history.push(ROUTES.LOGIN);
					}
				}
			} else {
				notifications.error({
					message: response.error || t('unexpected_error'),
				});
			}
		} catch (error) {
			notifications.error({
				message: t('unexpected_error'),
			});
		}

		setLoading(false);
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
		(async (): Promise<void> => {
			try {
				e.preventDefault();
				setLoading(true);

				if (!isPasswordValid(password)) {
					setIsPasswordPolicyError(true);
					setLoading(false);
					return;
				}

				if (isPreferenceVisible) {
					await commonHandler(onAdminAfterLogin);
				} else {
					await commonHandler(
						async (): Promise<void> => {
							history.push(ROUTES.APPLICATION);
						},
					);
				}

				setLoading(false);
			} catch (error) {
				notifications.error({
					message: t('unexpected_error'),
				});
				setLoading(false);
			}
		})();
	};

	const onSwitchHandler = (
		value: boolean,
		setFunction: React.Dispatch<React.SetStateAction<boolean>>,
	): void => {
		setFunction(value);
	};

	const getIsNameVisible = (): boolean =>
		!(firstName.length === 0 && !isPreferenceVisible);

	const isNameVisible = getIsNameVisible();

	useEffect(() => {
		if (!isPasswordValid(password) && password.length) {
			setIsPasswordPolicyError(true);
		} else {
			setIsPasswordPolicyError(false);
		}

		if (password !== confirmPassword) {
			setConfirmPasswordError(true);
		} else {
			setConfirmPasswordError(false);
		}
	}, [password, confirmPassword]);

	return (
		<WelcomeLeftContainer version={version}>
			<FormWrapper>
				<form onSubmit={!precheck.sso ? handleSubmit : handleSubmitSSO}>
					<Title level={4}>Create your account</Title>
					<div>
						<Label htmlFor="signupEmail">{t('label_email')}</Label>
						<Input
							placeholder={t('placeholder_email')}
							type="email"
							autoFocus
							value={email}
							onChange={(e): void => {
								setState(e.target.value, setEmail);
							}}
							required
							id="signupEmail"
							disabled={isDetailsDisable}
						/>
					</div>

					{isNameVisible && (
						<div>
							<Label htmlFor="signupFirstName">{t('label_firstname')}</Label>
							<Input
								placeholder={t('placeholder_firstname')}
								value={firstName}
								onChange={(e): void => {
									setState(e.target.value, setFirstName);
								}}
								required
								id="signupFirstName"
								disabled={isDetailsDisable}
							/>
						</div>
					)}

					<div>
						<Label htmlFor="organizationName">{t('label_orgname')}</Label>
						<Input
							placeholder={t('placeholder_orgname')}
							value={organizationName}
							onChange={(e): void => {
								setState(e.target.value, setOrganizationName);
							}}
							required
							id="organizationName"
							disabled={isDetailsDisable}
						/>
					</div>
					{!precheck.sso && (
						<div>
							<Label htmlFor="Password">{t('label_password')}</Label>
							<Input.Password
								value={password}
								onChange={(e): void => {
									setState(e.target.value, setPassword);
								}}
								required
								id="currentPassword"
							/>
						</div>
					)}
					{!precheck.sso && (
						<div>
							<Label htmlFor="ConfirmPassword">{t('label_confirm_password')}</Label>
							<Input.Password
								value={confirmPassword}
								onChange={(e): void => {
									const updateValue = e.target.value;
									setState(updateValue, setConfirmPassword);
								}}
								required
								id="confirmPassword"
							/>

							{confirmPasswordError && (
								<Typography.Paragraph
									italic
									id="password-confirm-error"
									style={{
										color: '#D89614',
										marginTop: '0.50rem',
									}}
								>
									{t('failed_confirm_password')}
								</Typography.Paragraph>
							)}
							{isPasswordPolicyError && (
								<Typography.Paragraph
									italic
									style={{
										color: '#D89614',
										marginTop: '0.50rem',
									}}
								>
									{isPasswordNotValidMessage}
								</Typography.Paragraph>
							)}
						</div>
					)}

					{isPreferenceVisible && (
						<>
							<MarginTop marginTop="2.4375rem">
								<Space>
									<Switch
										onChange={(value): void => onSwitchHandler(value, setHasOptedUpdates)}
										checked={hasOptedUpdates}
									/>
									<Typography>{t('prompt_keepme_posted')} </Typography>
								</Space>
							</MarginTop>

							<MarginTop marginTop="0.5rem">
								<Space>
									<Switch
										onChange={(value): void => onSwitchHandler(value, setIsAnonymous)}
										checked={isAnonymous}
									/>
									<Typography>{t('prompt_anonymise')}</Typography>
								</Space>
							</MarginTop>
						</>
					)}

					{isPreferenceVisible && (
						<Typography.Paragraph
							italic
							style={{
								color: '#D89614',
								marginTop: '0.50rem',
							}}
						>
							This will create an admin account. If you are not an admin, please ask
							your admin for an invite link
						</Typography.Paragraph>
					)}

					<ButtonContainer>
						<Button
							type="primary"
							htmlType="submit"
							data-attr="signup"
							loading={loading}
							disabled={
								loading ||
								!email ||
								!organizationName ||
								(!precheck.sso && (!password || !confirmPassword)) ||
								(!isDetailsDisable && !firstName) ||
								confirmPasswordError ||
								isPasswordPolicyError
							}
						>
							{t('button_get_started')}
						</Button>
					</ButtonContainer>
				</form>
			</FormWrapper>
		</WelcomeLeftContainer>
	);
}

interface SignUpProps {
	version: string;
}

export default SignUp;
