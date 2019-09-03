import * as React from 'react';
import { StyledComponent } from 'styled-components';
import { observer } from 'mobx-react';
import { Link, Match } from '@reach/router';
import * as dedent from 'dedent';

import { styled, css, Theme } from '../styles';
import { FontAwesomeIcon, IconProp } from '../icons';
import { UI_VERSION, desktopVersion, serverVersion } from '../services/service-versions';

import { UnstyledButton } from './common/inputs';
import * as logo from '../images/logo-stacked.svg';

export interface SidebarItem {
    name: string;
    icon: IconProp;
    position: 'top' | 'bottom';
    highlight?: true;

    type: 'web' | 'router' | 'callback';
    url?: string;
    onClick?: () => void;
}

interface SidebarProps {
    items: Array<SidebarItem>;
}

const SidebarNav = styled.nav`
    width: 90px;
    flex-shrink: 0;

    background-color: ${p => p.theme.mainBackground};
    color: ${p => p.theme.mainColor};
    z-index: 5;

    border-right: 1px solid rgba(0,0,0,0.12);
    box-sizing: border-box;
    box-shadow: 0 0 30px rgba(0,0,0,0.2);

    font-size: ${p => p.theme.textSize};

    display: flex;
    flex-direction: column;
`

const sidebarItemStyles = css`
    width: 80px;
    height: 80px;
    margin: 0 auto;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    box-sizing: border-box;
`;

const SidebarLogo = styled.img.attrs({
    src: logo,
    alt: 'HTTP Toolkit logo'
})`
    ${sidebarItemStyles}
`

const SidebarSelectableItem = styled(Link)`
    ${sidebarItemStyles}

    color: ${p => p.theme.mainColor};
    text-decoration: none;
    line-height: normal;

    width: calc(100% + 2px);
    margin: 0 -1px;

    cursor: pointer;
    user-select: none;
    &:hover, &:focus {
        outline: none;
        color: ${p => p.theme.popColor};
    }

    border-width: 0 5px;
    border-style: solid;
    border-color: transparent;

    opacity: 0.6;

    ${(p: { selected: boolean }) => p.selected && css`{
        opacity: 1;
        border-right-color: ${p => p.theme.popColor};
    }`}

    > svg {
        margin-bottom: 5px;
    }
`;

const Separator = styled.div`
    margin-top: auto;
`;

const SidebarLink = styled.a<{ highlight?: true }>`
    ${sidebarItemStyles}

    ${(p) => p.highlight && css`
        color:  ${p.theme.popColor};
        font-weight: bold;
    `};
    text-decoration: none;

    margin-bottom: 5px;

    > svg {
        margin-bottom: 5px;
    }
`;

const SidebarButton = styled(
    UnstyledButton as StyledComponent<"button", Theme, { highlight?: boolean }>
)`
    ${sidebarItemStyles}

    cursor: pointer;
    opacity: 0.6;

    ${(p) => p.highlight && css`
        color:  ${p.theme.popColor};
        font-weight: bold;
    `};

    > svg {
        margin-bottom: 5px;
    }
`;

export const Sidebar = observer((props: SidebarProps) => {
    const items = props.items.map((item, i) => {
        const itemContent = <>
            <FontAwesomeIcon size='2x' icon={item.icon} />
            {item.name}
        </>;

        if (item.type === 'web') {
            return {
                position: item.position,
                component: <SidebarLink
                    key={item.name}
                    highlight={item.highlight}
                    href={item.url}
                    target='_blank'
                >
                    { itemContent }
                </SidebarLink>
            }
        } else if (item.type === 'router') {
            return {
                position: item.position,
                component: <Match
                    key={item.name}
                    path={`${item.url!}/*`}
                >{({ match }) =>
                    <SidebarSelectableItem
                        to={item.url}
                        selected={!!match}
                    >
                        { itemContent }
                    </SidebarSelectableItem>
                }</Match>
            };
        } else {
            return {
                position: item.position,
                component: <SidebarButton
                    key={item.name}
                    highlight={item.highlight}
                    onClick={item.onClick}
                >
                    { itemContent }
                </SidebarButton>
            };
        }
    });

    return <SidebarNav>
        <SidebarLogo
            title={dedent`
                UI version: ${UI_VERSION.slice(0, 8)}
                Desktop version: ${
                    desktopVersion.state === 'fulfilled'
                        ? desktopVersion.value
                        : 'Unknown'
                }
                Server version: ${
                    serverVersion.state === 'fulfilled'
                        ? serverVersion.value
                        : 'Unknown'
                }
            `}
        />

        {
            items.filter(i => i.position === 'top').map((item) => item.component)
        }
        <Separator />
        {
            items.filter(i => i.position === 'bottom').map((item) => item.component)
        }
    </SidebarNav>;
});