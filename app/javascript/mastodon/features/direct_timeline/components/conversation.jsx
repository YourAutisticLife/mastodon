import PropTypes from 'prop-types';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';
import { Link, withRouter } from 'react-router-dom';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';

import { HotKeys } from 'react-hotkeys';

import MoreHorizIcon from 'mastodon/../material-icons/400-24px/more_horiz.svg?react';
import ReplyIcon from 'mastodon/../material-icons/400-24px/reply.svg?react';
import AttachmentList from 'mastodon/components/attachment_list';
import AvatarComposite from 'mastodon/components/avatar_composite';
import { IconButton } from 'mastodon/components/icon_button';
import { RelativeTimestamp } from 'mastodon/components/relative_timestamp';
import StatusContent from 'mastodon/components/status_content';
import DropdownMenuContainer from 'mastodon/containers/dropdown_menu_container';
import { autoPlayGif } from 'mastodon/initial_state';
import { WithRouterPropTypes } from 'mastodon/utils/react_router';

const messages = defineMessages({
  more: { id: 'status.more', defaultMessage: 'More' },
  open: { id: 'conversation.open', defaultMessage: 'View conversation' },
  reply: { id: 'status.reply', defaultMessage: 'Reply' },
  markAsRead: { id: 'conversation.mark_as_read', defaultMessage: 'Mark as read' },
  delete: { id: 'conversation.delete', defaultMessage: 'Delete conversation' },
  muteConversation: { id: 'status.mute_conversation', defaultMessage: 'Mute conversation' },
  unmuteConversation: { id: 'status.unmute_conversation', defaultMessage: 'Unmute conversation' },
});

class Conversation extends ImmutablePureComponent {

  static propTypes = {
    conversationId: PropTypes.string.isRequired,
    accounts: ImmutablePropTypes.list.isRequired,
    lastStatus: ImmutablePropTypes.map,
    unread:PropTypes.bool.isRequired,
    scrollKey: PropTypes.string,
    onMoveUp: PropTypes.func,
    onMoveDown: PropTypes.func,
    markRead: PropTypes.func.isRequired,
    delete: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    ...WithRouterPropTypes,
  };

  handleMouseEnter = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-original');
    }
  };

  handleMouseLeave = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-static');
    }
  };

  handleClick = () => {
    if (!this.props.history) {
      return;
    }

    const { lastStatus, unread, markRead } = this.props;

    if (unread) {
      markRead();
    }

    this.props.history.push(`/@${lastStatus.getIn(['account', 'acct'])}/${lastStatus.get('id')}`);
  };

  handleMarkAsRead = () => {
    this.props.markRead();
  };

  handleReply = () => {
    this.props.reply(this.props.lastStatus, this.props.history);
  };

  handleDelete = () => {
    this.props.delete();
  };

  handleHotkeyMoveUp = () => {
    this.props.onMoveUp(this.props.conversationId);
  };

  handleHotkeyMoveDown = () => {
    this.props.onMoveDown(this.props.conversationId);
  };

  handleConversationMute = () => {
    this.props.onMute(this.props.lastStatus);
  };

  handleShowMore = () => {
    this.props.onToggleHidden(this.props.lastStatus);
  };

  render () {
    const { accounts, lastStatus, unread, scrollKey, intl } = this.props;

    if (lastStatus === null) {
      return null;
    }

    const menu = [
      { text: intl.formatMessage(messages.open), action: this.handleClick },
      null,
    ];

    menu.push({ text: intl.formatMessage(lastStatus.get('muted') ? messages.unmuteConversation : messages.muteConversation), action: this.handleConversationMute });

    if (unread) {
      menu.push({ text: intl.formatMessage(messages.markAsRead), action: this.handleMarkAsRead });
      menu.push(null);
    }

    menu.push({ text: intl.formatMessage(messages.delete), action: this.handleDelete });

    const names = accounts.map(a => <Link to={`/@${a.get('acct')}`} key={a.get('id')} title={a.get('acct')}><bdi><strong className='display-name__html' dangerouslySetInnerHTML={{ __html: a.get('display_name_html') }} /></bdi></Link>).reduce((prev, cur) => [prev, ', ', cur]);

    const handlers = {
      reply: this.handleReply,
      open: this.handleClick,
      moveUp: this.handleHotkeyMoveUp,
      moveDown: this.handleHotkeyMoveDown,
      toggleHidden: this.handleShowMore,
    };

    return (
      <HotKeys handlers={handlers}>
        <div className={classNames('conversation focusable muted', { 'conversation--unread': unread })} tabIndex={0}>
          <div className='conversation__avatar' onClick={this.handleClick} role='presentation'>
            <AvatarComposite accounts={accounts} size={48} />
          </div>

          <div className='conversation__content'>
            <div className='conversation__content__info'>
              <div className='conversation__content__relative-time'>
                {unread && <span className='conversation__unread' />} <RelativeTimestamp timestamp={lastStatus.get('created_at')} />
              </div>

              <div className='conversation__content__names' onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
                <FormattedMessage id='conversation.with' defaultMessage='With {names}' values={{ names: <span>{names}</span> }} />
              </div>
            </div>

            <StatusContent
              status={lastStatus}
              onClick={this.handleClick}
              expanded={!lastStatus.get('hidden')}
              onExpandedToggle={this.handleShowMore}
              collapsible
            />

            {lastStatus.get('media_attachments').size > 0 && (
              <AttachmentList
                compact
                media={lastStatus.get('media_attachments')}
              />
            )}

            <div className='status__action-bar'>
              <IconButton className='status__action-bar-button' title={intl.formatMessage(messages.reply)} icon='reply' iconComponent={ReplyIcon} onClick={this.handleReply} />

              <div className='status__action-bar-dropdown'>
                <DropdownMenuContainer
                  scrollKey={scrollKey}
                  status={lastStatus}
                  items={menu}
                  icon='ellipsis-h'
                  iconComponent={MoreHorizIcon}
                  size={18}
                  direction='right'
                  title={intl.formatMessage(messages.more)}
                />
              </div>
            </div>
          </div>
        </div>
      </HotKeys>
    );
  }

}

export default withRouter(injectIntl(Conversation));
