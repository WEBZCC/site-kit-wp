/**
 * DraftIdeas component
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	IDEA_HUB_BUTTON_VIEW,
	IDEA_HUB_IDEAS_PER_PAGE,
	STORE_NAME,
} from '../../../datastore/constants';
import EmptyIcon from '../../../../../../svg/idea-hub-empty-draft-ideas.svg';
import PreviewTable from '../../../../../components/PreviewTable';
import Idea from './Idea';
import Empty from './Empty';
import Footer from './Footer';
const { useSelect } = Data;

const DraftIdeas = ( { active, WidgetReportError } ) => {
	const [ page, setPage ] = useState( 1 );
	const args = {
		offset: ( ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE ),
		length: IDEA_HUB_IDEAS_PER_PAGE,
	};
	const totalDraftIdeas = useSelect( ( select ) => select( STORE_NAME ).getDraftPostIdeas()?.length );
	const draftIdeas = useSelect( ( select ) => select( STORE_NAME ).getDraftPostIdeas( args ) );
	const hasFinishedResolution = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getDraftPostIdeas', [ args ] ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getDraftPostIdeas', [ args ] ) );

	const handlePrev = useCallback( () => {
		if ( page > 1 ) {
			setPage( page - 1 );
		}
	}, [ page, setPage ] );

	const handleNext = useCallback( () => {
		if ( page < Math.ceil( totalDraftIdeas / IDEA_HUB_IDEAS_PER_PAGE ) ) {
			setPage( page + 1 );
		}
	}, [ page, setPage, totalDraftIdeas ] );

	if ( ! active ) {
		return null;
	}

	if ( ! hasFinishedResolution ) {
		return (
			<PreviewTable rows={ 5 } rowHeight={ 70 } />
		);
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="idea-hub" error={ error } />;
	}

	if ( ! totalDraftIdeas ) {
		return (
			<Empty
				sideLayout={ false }
				Icon={ <EmptyIcon /> }
				title={ __( 'No drafts here yet', 'google-site-kit' ) }
				subtitle={ __( 'Ideas will appear here by starting a draft from the New or Saved tab', 'google-site-kit' ) }
			/>
		);
	}

	return (
		<Fragment>
			<div className="googlesitekit-idea-hub__draft-ideas">
				{ draftIdeas.map( ( idea, key ) => (
					<Idea
						key={ key }
						name={ idea.name }
						text={ idea.text }
						topics={ idea.topics }
						buttons={ [ IDEA_HUB_BUTTON_VIEW ] }
						postEditURL={ idea.postEditURL }
					/>
				) ) }
			</div>

			<Footer
				page={ page }
				totalIdeas={ totalDraftIdeas }
				handlePrev={ handlePrev }
				handleNext={ handleNext }
			/>
		</Fragment>
	);
};

DraftIdeas.propTypes = {
	active: PropTypes.bool.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default DraftIdeas;
