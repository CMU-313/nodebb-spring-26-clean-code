{{{ each dateGroups }}}
<div component="category/date-group" class="date-group mb-2" data-label="{./label}">
    <div component="category/date-group/header" class="date-group-header d-flex align-items-center gap-2 p-2 rounded cursor-pointer user-select-none" data-bs-toggle="collapse" data-bs-target="#date-group-{./label.slugify}" aria-expanded="true" aria-controls="date-group-{./label.slugify}">
        <i class="fa fa-chevron-down date-group-chevron text-muted"></i>
        <span class="fw-semibold text-sm">{./label}</span>
        <span class="badge border border-gray-300 text-body text-xs">{./topics.length}</span>
    </div>
    <div id="date-group-{./label.slugify}" class="collapse show">
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
                            <a class="text-reset" href="{{{ if topics.noAnchor }}}#{{{ else }}}{config.relative_path}/topic/{../slug}{{{ if ../bookmark }}}/{../bookmark}{{{ end }}}{{{ end }}}">{../title}</a>
                        </h3>
                        <span component="topic/labels" class="d-flex flex-wrap gap-1 w-100">
                            <span component="topic/watched" class="badge border border-gray-300 text-body {{{ if !../followed }}}hidden{{{ end }}}">


                            </span>
                            <span component="topic/ignored" class="badge border border-gray-300 text-body {{{ if !../ignored }}}hidden{{{ end }}}">


                            </span>
                            <span component="topic/scheduled" class="badge border border-gray-300 text-body {{{ if !../scheduled }}}hidden{{{ end }}}">


                            </span>
                            <span component="topic/pinned" class="badge border border-gray-300 text-body {{{ if (../scheduled || !../pinned) }}}hidden{{{ end }}}">


                            </span>
                            <span component="topic/locked" class="badge border border-gray-300 text-body {{{ if !../locked }}}hidden{{{ end }}}">


                            </span>
                            <span component="topic/moved" class="badge border border-gray-300 text-body {{{ if (!../oldCid || (../oldCid == "-1")) }}}hidden{{{ end }}}">


                            </span>
                            {{{each ../icons}}}<span class="lh-1">{@value}</span>{{{end}}}

                            {{{ if (!template.category || (cid != ../cid)) }}}
                            {buildCategoryLabel(../category, "a", "border")}
                            {{{ end }}}
                        </span>
                        {{{ if showSelect }}}
                        <div class="checkbox position-absolute top-0 end-0 m-0 d-flex d-lg-none" style="max-width:max-content">

                        </div>
                        {{{ end }}}
                    </div>
                    {{{ if ../thumbs.length }}}
                    <a class="topic-thumbs position-relative text-decoration-none flex-shrink-0 d-none d-xl-block" href="{config.relative_path}/topic/{../slug}{{{ if ../bookmark }}}/{../bookmark}{{{ end }}}" aria-label="[[topic:thumb-image]]">
                        <img class="topic-thumb rounded-1 bg-light" style="width:auto;max-width: 5.33rem;height: 3.33rem;object-fit: contain;" src="{../thumbs.0.url}" alt=""/>
                        <span data-numthumbs="{../thumbs.length}" class="px-1 position-absolute bottom-0 end-0 badge rounded-0 border fw-semibold text-bg-light" style="z-index: 1; border-top-left-radius: 0.25rem!important; border-bottom-right-radius: 0.25rem!important;">{../thumbs.length}</span>
                    </a>
                    {{{ end }}}
                </div>

                <div class="d-flex p-0 col-lg-5 col-12 align-content-stretch">
                    <div class="meta stats d-none d-lg-grid col-6 gap-1 pe-2 text-muted" style="grid-template-columns: {{{ if !reputation:disabled }}}1fr{{{ end }}} 1fr 1fr;">
                        {{{ if !reputation:disabled }}}
                        <div class="stats-votes card card-header border-0 p-2 overflow-hidden rounded-1 d-flex flex-column align-items-center">



                        </div>
                        {{{ end }}}
                        <div class="stats-postcount card card-header border-0 p-2 overflow-hidden rounded-1 d-flex flex-column align-items-center">



                        </div>
                        <div class="stats-viewcount card card-header border-0 p-2 overflow-hidden rounded-1 d-flex flex-column align-items-center">



                        </div>
                    </div>
                    <div component="topic/teaser" class="meta teaser ps-5 ps-lg-0 col-lg-6 col-12 {{{ if !config.theme.mobileTopicTeasers }}}d-none d-lg-block{{{ end }}}">
                        <div class="lastpost border-start border-2 lh-sm h-100 d-flex flex-column gap-1" style="border-color: {../category.bgColor}!important;">
                        </div>
                    </div>
                </div>
            </li>
            {{{ end }}}
        </ul>
    </div>
</div>
{{{ end }}}