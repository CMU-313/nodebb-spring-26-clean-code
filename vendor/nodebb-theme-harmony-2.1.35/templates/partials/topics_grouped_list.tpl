{{{ each dateGroups }}}
<div component="category/date-group" class="date-group mb-2" data-label="{./label}">
    <div component="category/date-group/header" class="date-group-header d-flex align-items-center gap-2 p-2 rounded cursor-pointer user-select-none" aria-expanded="true">
        <i class="fa fa-chevron-down date-group-chevron text-muted"></i>
        <span class="fw-semibold text-sm">{./label}</span>
        <span class="badge border border-gray-300 text-body text-xs">{./topics.length}</span>
    </div>
    <div class="date-group-body">
        <ul component="category" class="topics-list list-unstyled date-group-topics" itemscope itemtype="http://www.schema.org/ItemList" data-nextstart="{nextStart}" data-set="{set}">
            {{{ each ./topics }}}
            <li component="category/topic" class="category-item hover-parent border-bottom py-3 py-lg-4 d-flex flex-column flex-lg-row align-items-start {function.generateTopicClass}" <!-- IMPORT partials/data/category.tpl -->>
                <link itemprop="url" content="{config.relative_path}/topic/{../slug}" />
                <meta itemprop="name" content="{function.stripTags, ../title}" />
                <meta itemprop="itemListOrder" content="descending" />
                <meta itemprop="position" content="{increment(../index, "1")}" />
                <a id="{../index}" data-index="{../index}" component="topic/anchor"></a>

                <div class="d-flex p-0 col-12 col-lg-7 gap-2 gap-lg-3 pe-1 align-items-start {{{ if config.theme.mobileTopicTeasers }}}mb-2 mb-lg-0{{{ end }}}">
                    <div class="flex-shrink-0 position-relative">
                        <a class="d-inline-block text-decoration-none avatar-tooltip" title="{../user.displayname}" href="{{{ if ../user.userslug }}}{config.relative_path}/user/{../user.userslug}{{{ else }}}#{{{ end }}}">
                            {buildAvatar(../user, "40px", true)}
                        </a>
                        {{{ if showSelect }}}
                        <div class="checkbox position-absolute top-100 start-50 translate-middle-x pt-2 m-0 d-none d-lg-flex" style="max-width:max-content">
                            <i component="topic/select" class="fa text-muted pointer fa-square-o p-1 hover-visible"></i>
                        </div>
                        {{{ end }}}
                    </div>
                    <div class="flex-grow-1 d-flex flex-wrap gap-1 position-relative">
                        <h3 component="topic/header" class="title text-break fs-5 fw-semibold m-0 tracking-tight w-100 {{{ if showSelect }}}me-4 me-lg-0{{{ end }}}">
                            {{{ if ../noAnchor }}}
                            <span>{../title}</span>
                            {{{ else }}}
                            <a href="{config.relative_path}/topic/{../slug}{{{ if ../bookmark }}}/{../bookmark}{{{ end }}}" class="text-reset">{../title}</a>
                            {{{ end }}}
                        </h3>
                        <div class="d-flex gap-1 flex-wrap align-items-center">
                            <!-- IMPORT partials/category/tags.tpl -->
                            {{{ if !template.category }}}
                            <a href="{config.relative_path}/category/{../category.slug}" class="badge border border-gray-300 text-body text-xs lh-base">{../category.name}</a>
                            {{{ end }}}
                        </div>
                        {{{ if showSelect }}}
                        <div class="checkbox position-absolute top-0 end-0 m-0 d-flex d-lg-none" style="max-width:max-content">
                            <i component="topic/select" class="fa text-muted pointer fa-square-o p-1 hover-visible"></i>
                        </div>
                        {{{ end }}}
                    </div>
                </div>
                <div class="d-none d-lg-flex col-lg-5 ms-auto gap-2 align-items-start justify-content-end">
                    <div class="d-flex gap-1 flex-nowrap align-items-stretch flex-shrink-0">
                        {{{ if !reputation:disabled }}}
                        <div class="stats-votes card card-header border-0 p-2 overflow-hidden rounded-1 d-flex flex-column align-items-center">
                            <span class="text-xs fw-semibold" title="{../votes}">{humanReadableNumber(../votes)}</span>
                            <span class="text-xs text-muted">[[global:votes]]</span>
                        </div>
                        {{{ end }}}
                        <div class="stats-postcount card card-header border-0 p-2 overflow-hidden rounded-1 d-flex flex-column align-items-center">
                            <span class="text-xs fw-semibold" title="{../postcount}">{humanReadableNumber(../postcount)}</span>
                            <span class="text-xs text-muted">[[global:posts]]</span>
                        </div>
                        <div class="stats-viewcount card card-header border-0 p-2 overflow-hidden rounded-1 d-flex flex-column align-items-center">
                            <span class="text-xs fw-semibold" title="{../viewcount}">{humanReadableNumber(../viewcount)}</span>
                            <span class="text-xs text-muted">[[global:views]]</span>
                        </div>
                    </div>
                    <div component="topic/teaser" class="meta teaser flex-grow-1 min-width-0 {{{ if !config.theme.mobileTopicTeasers }}}d-none d-lg-block{{{ end }}}">
                        <div class="lastpost border-start border-2 lh-sm h-100 d-flex flex-column gap-1 ps-2" style="border-color: {../category.bgColor}!important;">
                            {{{ if ../unreplied }}}
                            <div class="text-xs">
                                [[category:no-replies]]
                            </div>
                            {{{ else }}}
                            {{{ if ../teaser.pid }}}
                            <div>
                                <a href="{{{ if ../teaser.user.userslug }}}{config.relative_path}/user/{../teaser.user.userslug}{{{ else }}}#{{{ end }}}" class="text-decoration-none avatar-tooltip" title="{../teaser.user.displayname}">{buildAvatar(../teaser.user, "18px", true)}</a>
                                <a class="permalink text-muted timeago text-xs" href="{config.relative_path}/topic/{../slug}/{../teaser.index}" title="{../teaser.timestampISO}" aria-label="[[global:lastpost]]"></a>
                            </div>
                            <div class="post-content text-xs line-clamp-sm-2 lh-sm text-break position-relative flex-fill">
                                <a class="stretched-link" tabindex="-1" href="{config.relative_path}/topic/{../slug}/{../teaser.index}" aria-label="[[global:lastpost]]"></a>
                                {../teaser.content}
                            </div>
                            {{{ end }}}
                            {{{ end }}}
                        </div>
                    </div>
                </div>
            </li>
            {{{ end }}}
        </ul>
    </div>
</div>
{{{ end }}}