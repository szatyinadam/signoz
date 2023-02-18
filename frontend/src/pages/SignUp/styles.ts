import { Card } from 'antd';
import React from 'react';
import styled from 'styled-components';

export const FormWrapper = styled(Card)`
	display: flex;
	justify-content: center;
	max-width: 432px;
	flex: 1;
`;

export const Label = styled.label`
	margin-bottom: 11px;
	margin-top: 19px;
	display: inline-block;
	font-size: 1rem;
	line-height: 24px;
`;

export const ButtonContainer = styled.div`
	margin-top: 1.8125rem;
	display: flex;
	justify-content: center;
	align-items: center;
`;

interface Props {
	marginTop: React.CSSProperties['marginTop'];
}

export const MarginTop = styled.div<Props>`
	margin-top: ${({ marginTop = 0 }): number | string => marginTop};
`;
