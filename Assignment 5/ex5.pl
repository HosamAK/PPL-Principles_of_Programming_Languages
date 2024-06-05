/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).

% Signature: sub_list(Sublist, List)/2
% Purpose: All elements in Sublist appear in List in the same order.
% Precondition: List is fully instantiated (queries do not include variables in their second argument).

sub_list([], _).
sub_list([Y|Ys], [Y|Xs]) :- sub_list(Ys, Xs).
sub_list([Y|Ys], [_|Xs]) :- sub_list([Y|Ys], Xs).

% Signature: sub_tree(Subtree, Tree)/2
% Purpose: Tree contains Subtree.

sub_tree(tree(X,LeftSub,RightSub), tree(X,LeftSub,RightSub)).
sub_tree(Subtree, tree(_, _, RightSub)) :- sub_tree(Subtree, RightSub).
sub_tree(Subtree, tree(_, LeftSub, _)) :- sub_tree(Subtree, LeftSub).

% Signature: swap_tree(Tree, InversedTree)/2
% Purpose: InversedTree is the �mirror� representation of Tree.

swap_tree(void, void).
InversedTreeF(Value, Left, Right) :- tree(Value, InversedLeft, InversedRight)
swap_tree(tree(Value, Left, Right), InversedTree) :-
    swap_tree(Left, InversedRight),
    swap_tree(Right, InversedLeft),
    InversedTree = InversedTreeF(Value, InversedLeft, InversedRight).